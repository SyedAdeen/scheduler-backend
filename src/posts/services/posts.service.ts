import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationPostsTypes } from '../../common/database/entities/integration-posts-types.entity';
import { Post } from '../../common/database/entities/post.entity';
import { PostMedia } from '../../common/database/entities/post-media.entity';
import { CreatePostDto } from '../dtos/create-post.dto';
import { v2 as cloudinary } from 'cloudinary';


@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(IntegrationPostsTypes)
    private readonly integrationPostsTypesRepository: Repository<IntegrationPostsTypes>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
  ) {}

  async getPostTypesForIntegration(integrationId: number): Promise<{ id: number, name: string }[]> {
    // Convert integrationId to number
    const integrationIdNumber = integrationId;

    if (isNaN(integrationIdNumber)) {
      throw new NotFoundException(`Invalid integration ID ${integrationId}`);
    }

    const postTypes = await this.integrationPostsTypesRepository.find({
      where: { integration: { id: integrationIdNumber } },
      relations: ['postType'] // Fetch related post types
    });

    if (!postTypes.length) {
      throw new NotFoundException(`No post types found for integration ID ${integrationId}`);
    }

    // Map the results to return only the postType id and name
    return postTypes.map(pt => ({
      id: pt.postType.id,
      name: pt.postType.name
    }));
  }

  async createPost(
    userId: number,
    integrationId: number,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[]
  ): Promise<void> {
    Logger.log("Create post Dto:",createPostDto);
    // Step 1: Create the post in the `posts` table
    const post = this.postRepository.create({
      ...createPostDto,
      integration: { id: integrationId },
      user: { id: userId },
      status: "Posted"
    });

    await this.postRepository.save(post);

    // Step 2: Upload media files to Cloudinary (images/videos) and store URLs in the `post_media` table
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'auto' }, // Handles both images and videos
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          ).end(file.buffer);
        });
        Logger.log("URLS", result.secure_url);

        // Save the media URL in the `post_media` table
        const postMedia = this.postMediaRepository.create({
          post: { id: post.id },
          media_url: result.secure_url,
        });

        await this.postMediaRepository.save(postMedia);
        Logger.log("URL Saved Successfully");
      }
    }

    // Step 3: Check if the post needs to be posted immediately or scheduled
    if (!createPostDto.recurring && !createPostDto.scheduled) {
      // Post immediately to the respective platform (e.g., LinkedIn)
      Logger.log("Need to posted right now");
      await this.postToPlatform(post.id, integrationId);
    } else if (createPostDto.scheduled) {
      // Logic to schedule the post using some scheduling mechanism
      // For example, using Bull or Cron Jobs to schedule it for the given time
      this.schedulePost(post.id, createPostDto.scheduled);
    }
  }
  


  // Example method to schedule the post
  private schedulePost(postId: number, scheduledDate: string): void {
    // Logic to schedule the post using a scheduler like Bull or Cron
  }

  async uploadMedia(postId: number, files: Array<Express.Multer.File>): Promise<void> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No media files provided');
    }

    for (const file of files) {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });

      const postMedia = this.postMediaRepository.create({
        post: { id: postId },
        media_url: result.secure_url,
      });

      await this.postMediaRepository.save(postMedia);
    }
  }

  private async postToPlatform(postId: number, integrationId: number) {
    // Logic to determine the platform (LinkedIn, etc.) based on integration ID
    // For example, use an integration service to get platform details
    const platform = await this.getPlatformByIntegrationId(integrationId);

    if (platform === 'LinkedIn') {
      // Call a service to post to LinkedIn
      await this.postToLinkedIn(postId);
    }
  }

  private async getPlatformByIntegrationId(integrationId: number): Promise<string> {
    // Logic to get platform (e.g., LinkedIn) based on integration ID
    return 'LinkedIn';  // Example
  }

  private async postToLinkedIn(postId: number) {
    // Implement LinkedIn posting logic using the LinkedIn API
  }
}

