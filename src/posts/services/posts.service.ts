import { BadRequestException, Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationPostsTypes } from '../../common/database/entities/integration-posts-types.entity';
import { Post } from '../../common/database/entities/post.entity';
import { PostMedia } from '../../common/database/entities/post-media.entity';
import { UserIntegration } from '../../common/database/entities/user-integration.entity';
import { Integration } from '@entities/integration.entity';
import { CreatePostDto } from '../dtos/create-post.dto';
import { v2 as Cloudinary } from 'cloudinary';
import axios from 'axios';
import { classToPlain } from 'class-transformer';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(IntegrationPostsTypes)
    private readonly integrationPostsTypesRepository: Repository<IntegrationPostsTypes>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    @InjectRepository(UserIntegration)
    private readonly userIntegrationRepository: Repository<UserIntegration>,
    @Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary,
  ) {}

  async getPostTypesForIntegration(integrationId: number): Promise<{ id: number, name: string }[]> {
    const integrationIdNumber = integrationId;
    if (isNaN(integrationIdNumber)) {
      throw new NotFoundException(`Invalid integration ID ${integrationId}`);
    }

    const postTypes = await this.integrationPostsTypesRepository.find({
      where: { integration: { id: integrationIdNumber } },
      relations: ['postType'],
    });

    if (!postTypes.length) {
      throw new NotFoundException(`No post types found for integration ID ${integrationId}`);
    }

    return postTypes.map((pt) => ({
      id: pt.postType.id,
      name: pt.postType.name,
    }));
  }

  async createPost(
    userId: number,
    integrationId: number,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
  ): Promise<{message:string}> {
    this.logger.log('Create post DTO:', createPostDto);
    
    const mediaType = createPostDto.mediaType;
    
    Logger.log(mediaType);
    
    Logger.log(createPostDto.poll);

    let pollObject=null;

    if(mediaType==='Poll')
    {
      const plainDto = classToPlain(createPostDto);
  
      pollObject = plainDto.poll || {}  

      if (typeof pollObject === 'string') {
        try {
          pollObject = JSON.parse(pollObject);
        } catch (error) {
          this.logger.error('Failed to parse pollObject:', {
            message: error.message,
          });
          throw new BadRequestException('Invalid poll object format.');
        }
      }     

    }
    
    const post = this.postRepository.create({
      ...createPostDto,
      integration: { id: integrationId },
      user: { id: userId },
      status: 'Post Created',
      metadata: pollObject
    });

    await this.postRepository.save(post);

    if (files && files.length > 0) {
      for (const file of files) {
        const result = await new Promise<any>((resolve, reject) => {
          this.cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          ).end(file.buffer);
        });
        this.logger.log('Cloudinary URL:', result.secure_url);

        const postMedia = this.postMediaRepository.create({
          post: { id: post.id },
          mediaUrl: result.secure_url,
        });

        await this.postMediaRepository.save(postMedia);
        this.logger.log('Media saved successfully');
      }
    }

    if (!createPostDto.recurring && !createPostDto.scheduled) {
      this.logger.log('Post immediately');
      return await this.postToPlatform(post.id, integrationId, createPostDto);
    } else if (createPostDto.scheduled) {
      this.schedulePost(post.id, createPostDto.scheduled);
    }
  }

  private schedulePost(postId: number, scheduledDate: string): void {
    // Implement scheduling logic
  }

  private async postToPlatform(postId: number, integrationId: number, createPostDto:CreatePostDto) {
    const platform = await this.getPlatformByIntegrationId(integrationId);
    const mediaType = createPostDto.mediaType;

    switch (platform) {
      case 'LinkedIn':
        return await this.postToLinkedIn(postId, integrationId, createPostDto);
        break;
    }
  }

  private async getPlatformByIntegrationId(integrationId: number): Promise<string> {
    const integration = await this.integrationRepository.findOne({where:{id:integrationId}})
    return integration.platform;
  }

  private async postToLinkedIn(postId: number, integrationId: number, createPostDto:CreatePostDto) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['postMedia', 'user'],
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found.`);
    }
    const mediaType = createPostDto.mediaType;

    this.logger.log('Post:', post);
    Logger.log("Media Type in this.postToLinkedIn",mediaType);

    const accessToken = await this.getAccessToken(post.user.id, integrationId);

    if (!accessToken) {
      throw new BadRequestException('LinkedIn access token is missing for this user.');
    }

    let mediaAssets: any[] = [];
    if(mediaType!== 'Poll')
    {
      if (post.postMedia && post.postMedia.length > 0) {
        for (const media of post.postMedia) {
          const mediaAsset = await this.registerLinkedInMedia(media.mediaUrl, accessToken, mediaType);
          if (mediaAsset) {
            mediaAssets.push(mediaAsset);
          }
        }
      }

    }    

    if (mediaAssets.length === 0 && mediaType!=='Poll') {
      return await this.publishPostToLinkedInContentOnly(post.content || 'Default content text', accessToken);
    } else {
      return await this.publishPostToLinkedInContentWithMedia(post, mediaAssets, accessToken, createPostDto );
    }
  }

  private async getAccessToken(userId: number, integrationId: number): Promise<string> {
    const userIntegration = await this.userIntegrationRepository.findOne({
      where: { user: { id: userId }, integration: { id: integrationId } },
    });

    if (!userIntegration || !userIntegration.metadata || !userIntegration.metadata.accessToken) {
      throw new BadRequestException('Access token not found');
    }

    return userIntegration.metadata.accessToken;
  }

  private async getPersonUrn(accessToken: string): Promise<string> {
    try {
      const response = await axios.get(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const { sub } = response.data;

      if (!sub) {
        throw new BadRequestException('User ID not found in LinkedIn response.');
      }

      return `urn:li:person:${sub}`;
    } catch (error) {
      this.logger.error('Error fetching LinkedIn user URN:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new BadRequestException('Failed to fetch LinkedIn user URN.');
    }
  }

  private async registerLinkedInMedia(mediaUrl: string, accessToken: string, mediaType: any): Promise<string> {
    try {
      const personUrn = await this.getPersonUrn(accessToken);
  
      let recipe;
      if (mediaType === 'Video') {
        recipe = 'urn:li:digitalmediaRecipe:feedshare-video';
      } else if (mediaType === 'Document') {
        recipe = 'urn:li:digitalmediaRecipe:feedshare-document';
      } else {
        recipe = 'urn:li:digitalmediaRecipe:feedshare-image';
      }

      Logger.log("Recipe:",recipe);
  
      const registerResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            owner: personUrn,
            recipes: [recipe],
            serviceRelationships: [{
              identifier: 'urn:li:userGeneratedContent',
              relationshipType: 'OWNER',
            }],
            supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;
  
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      await axios.put(uploadUrl, mediaResponse.data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': mediaType,
        },
      });
  
      return asset;
    } catch (error) {
      this.logger.error('Error registering or uploading media to LinkedIn:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new BadRequestException('Failed to upload media to LinkedIn.');
    }
  }
  
  private async publishPostToLinkedInContentOnly(content: string, accessToken: string) {
    try {
      const personUrn = await this.getPersonUrn(accessToken);

      Logger.log(personUrn);

      const postResponse = await axios.post(
        'https://api.linkedin.com/v2/shares',
        {
          content: {
            contentEntities: [],
            title: content,
          },
          owner: personUrn,
          subject: 'Posting from NestJS',
          text: { text: content },
          distribution: {
            linkedInDistributionTarget: {
              connectionsOnly: true,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log('Post published successfully:', postResponse.data);
      return {message:"Post Published Successfully"};
    } catch (error) {
      this.logger.error('Error publishing post to LinkedIn:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new BadRequestException('Failed to publish post to LinkedIn.');
    }
  }

  private async publishPostToLinkedInContentWithMedia(post: Post, mediaAssets: any[], accessToken: string, createPostDto: CreatePostDto) {
    try {
      const personUrn = await this.getPersonUrn(accessToken);
      this.logger.log("Person Urn:", personUrn);
  
      // Convert DTO to plain object
      const plainDto = classToPlain(createPostDto);
  
      // Extract media type and handle pollObject
      const mediaType = plainDto.mediaType;
      let pollObject = plainDto.poll || {};

      if(mediaType==='Poll')
      {
        if (typeof pollObject === 'string') {
          try {
            pollObject = JSON.parse(pollObject);
          } catch (error) {
            this.logger.error('Failed to parse pollObject:', {
              message: error.message,
            });
            throw new BadRequestException('Invalid poll object format.');
          }
        }
      }      
  
      // Determine media category
      const mediaCategory = mediaAssets.length > 1
        ? 'CAROUSEL'
        : mediaType === 'Video'
        ? 'VIDEO'
        : mediaType === 'Document'
        ? 'DOCUMENT'
        : 'IMAGE';
  
      if (mediaType === 'Poll') {
        // Log the type of poll to ensure it is an object
        this.logger.log('Poll Type:', typeof pollObject);
  
        // Handle poll-specific API call
        const pollPayload = {
          author: personUrn,
          commentary: post.content || '',
          visibility: 'PUBLIC',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: []
          },
          lifecycleState: 'PUBLISHED',
          isReshareDisabledByAuthor: false,
          content: {
            "poll": {
              ...pollObject,  // Spread the existing properties of poll
              "settings": {
                "duration": "THREE_DAYS"
              }
            }
          }
        };
  
        this.logger.log('Publishing poll to LinkedIn with payload:', pollPayload);
  
        const response = await axios.post(
          'https://api.linkedin.com/rest/posts',
          pollPayload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'LinkedIn-Version': '202309',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );
  
        this.logger.log('Poll published successfully:', response.data);
      } else {
        // Handle other media types
        const postPayload = {
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: post.content || '',
              },
              shareMediaCategory: mediaCategory,
              media: mediaAssets.map(asset => ({
                status: 'READY',
                description: {
                  text: post.content || '',
                },
                media: asset,
              })),
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        };
  
        this.logger.log('Publishing post to LinkedIn with payload:', postPayload);
  
        const response = await axios.post(
          'https://api.linkedin.com/v2/ugcPosts',
          postPayload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        this.logger.log('Post published successfully:', response.data);
        return {message:"Post Published Successfully"};
      }
    } catch (error) {
      this.logger.error('Error publishing post to LinkedIn:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new BadRequestException('Failed to publish post to LinkedIn.');
    }
  }   
  
}
