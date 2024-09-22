import { BadRequestException, Injectable, Logger, NotFoundException, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationPostsTypes } from '../../common/database/entities/integration-posts-types.entity';
import { Post } from '../../common/database/entities/post.entity';
import { PostMedia } from '../../common/database/entities/post-media.entity';
import { UserIntegration } from '../../common/database/entities/user-integration.entity';
import { Integration } from '@entities/integration.entity';
import { CreatePostDto, MediaType } from '../dtos/create-post.dto';
import { v2 as Cloudinary } from 'cloudinary';
import axios from 'axios';
import { classToPlain } from 'class-transformer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PostHistory } from '@entities/post-history.entity';
import { PostStatus } from '../dtos/create-post.dto';
import * as FormData from 'form-data'
import e from 'express';
import { create } from 'domain';
import { access } from 'fs';

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
    @InjectRepository(PostHistory)
    private readonly postHistoryRepository: Repository<PostHistory>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    @InjectRepository(UserIntegration)
    private readonly userIntegrationRepository: Repository<UserIntegration>,
    @Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary,
    @InjectQueue('post-scheduler') private readonly postSchedulerQueue: Queue,
  ) { }

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
  ): Promise<{ message: string }> {
    try {
      this.logger.log('Create post DTO:', createPostDto);

      const mediaType = createPostDto.mediaType;

      Logger.log(mediaType);

      Logger.log(createPostDto.poll);

      let pollObject = null;

      if (mediaType === 'Poll') {
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

      if (createPostDto.scheduled) {
        const isRecurring = createPostDto.recurring;

        if (!isRecurring) {
          // Handle one-time scheduling
          const inputDate = new Date(createPostDto.scheduled);

          if (isNaN(inputDate.getTime())) {
            throw new BadRequestException('Invalid date format for one-time scheduling.');
          }
          createPostDto.scheduled = new Date(inputDate.getTime() + createPostDto.timezoneOffset * 60000).toISOString();
        } else {
          // Handle recurring posts
          const currentDate = new Date();
          const currentDateStr = currentDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'

          // Extract time part (HH:MM)
          const time = createPostDto.scheduled;
          if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
            throw new BadRequestException('Invalid time format for recurring scheduling. Expected format is HH:MM.');
          }

          this.logger.log("time = ", time);

          // Construct the full datetime string in UTC format without time zone conversion
          const utcScheduledDate = new Date(`${currentDateStr}T${time}:00Z`); // Add 'Z' to indicate UTC
          this.logger.log("utc Schedule Date = ", utcScheduledDate);

          // Validate the constructed date-time
          if (isNaN(utcScheduledDate.getTime())) {
            throw new BadRequestException('Invalid date-time format for recurring scheduling.');
          }

          createPostDto.scheduled = new Date(utcScheduledDate.getTime() + createPostDto.timezoneOffset * 60000).toISOString();
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
      if (createPostDto.recurring || createPostDto.scheduled) {
        // Handle scheduling
        if (createPostDto.scheduled) {
          return this.schedulePost(post.id, createPostDto.scheduled, integrationId, createPostDto);
        }
      } else {
        this.logger.log("Post Immediately");
        // Enqueue immediate post
        await this.postSchedulerQueue.add('schedule-post', {
          limiter: {
            max: 10, // Maximum 10 jobs
            duration: 1000 * 60 * 5, // Every 5 minutes
          },
          postId: post.id,
          integrationId,
          createPostDto,
        });
        return { message: "Post Added" };
      }
    } catch (error) {
      this.logger.error('Error creating post:', { message: error.message });
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error; // Re-throw known exceptions
      }
      throw new InternalServerErrorException('An unexpected error occurred while creating the post.');
    }

  }

  private async createPostHistory(postId: number, status: string, details: string, success: boolean) {
    const postHistory = this.postHistoryRepository.create({
      post: { id: postId },
      status,
      details,
      success,
    });
    await this.postHistoryRepository.save(postHistory);
  }

  private async schedulePost(
    postId: number,
    scheduledDate: string,
    integrationId: number,
    createPostDto: CreatePostDto
  ): Promise<{ message: string }> {

    if (createPostDto.recurring) {
      // For recurring posts, generate a cron pattern
      const cronPattern = this.generateCronPatternFromDate(createPostDto.scheduled, createPostDto);
      this.logger.log("Recurring Cron Pattern = ", cronPattern);

      await this.postRepository.update(postId, { cronFormat: cronPattern });
      await this.postSchedulerQueue.add('schedule-post', {
        limiter: {
          max: 10, // Maximum 10 jobs
          duration: 1000 * 60 * 5, // Every 5 minutes
        },
        postId,
        integrationId,
        createPostDto,
      }, {
        repeat: { cron: cronPattern },
        removeOnComplete: true,
        removeOnFail: true,
      });

      this.logger.log(`Recurring post scheduled with cron pattern: ${cronPattern}`);
      return { message: "Recurring Post has been scheduled" };
    } else if (scheduledDate) {
      // Handle one-time scheduled posts
      const delay = new Date(scheduledDate).getTime() - Date.now();
      if (delay < 0) {
        await this.createPostHistory(postId, 'Failed', "Scheduled date must be in the future.", false);
        throw new BadRequestException("Scheduled date must be in the future.");
      }

      await this.postSchedulerQueue.add('schedule-post', {
        limiter: {
          max: 10, // Maximum 10 jobs
          duration: 1000 * 60 * 5, // Every 5 minutes
        },
        postId,
        integrationId,
        createPostDto,
      }, {
        delay,
        removeOnComplete: true,
        removeOnFail: true,
      });

      this.logger.log(`Post scheduled for: ${scheduledDate}`);
      return { message: `Post scheduled for: ${scheduledDate}` };
    }
  }

  // Helper function to generate cron patterns based on date
  private generateCronPatternFromDate(scheduledTime: string, createPostDto: CreatePostDto): string {
    // Parse the scheduled time (e.g., '2024-09-19T13:08:00.000Z')
    const dateObj = new Date(scheduledTime);

    // Extract hours and minutes in UTC
    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();

    const recurringType = createPostDto.recurring_type;
    const currentDayOfWeek = createPostDto.dayofweek; // Day of the week name
    const currentDateOfMonth = createPostDto.dateofmonth; // Day of the month (1-31)

    // Map day names to cron values
    const dayOfWeekMap: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    switch (recurringType) {
      case 'Daily':
        // Every day at the specified time
        return `${minutes} ${hours} * * *`;

      case 'Weekly':
        // Convert day of week name to cron value
        const cronDayOfWeek = dayOfWeekMap[currentDayOfWeek] !== undefined ? dayOfWeekMap[currentDayOfWeek] : '*';
        return `${minutes} ${hours} * * ${cronDayOfWeek}`;

      case 'Monthly':
        // Ensure dateOfMonth is within valid range (1-31)
        const validDateOfMonth = (currentDateOfMonth >= 1 && currentDateOfMonth <= 31) ? currentDateOfMonth : '*';
        return `${minutes} ${hours} ${validDateOfMonth} * *`;

      default:
        throw new BadRequestException('Invalid recurring type');
    }
  }


  private getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }


  public async postToPlatform(postId: number, integrationId: number, createPostDto: CreatePostDto) {
    const platform = await this.getPlatformByIntegrationId(integrationId);
    this.logger.log("In the Post To Platform Function");

    switch (platform) {
      case 'LinkedIn':
        return await this.postToLinkedIn(postId, integrationId, createPostDto);
      case 'Facebook':
        return await this.postToFacebook(postId, integrationId, createPostDto);
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  private async getPlatformByIntegrationId(integrationId: number): Promise<string> {
    const integration = await this.integrationRepository.findOne({ where: { id: integrationId } })
    return integration.platform;
  }

  private async postToFacebook(postId: number, integrationId: number, createPostDto: CreatePostDto) {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: ['postMedia', 'user'] });

    // Step 1: Get the User Access Token
    const userAccessToken = await this.getAccessToken(post.user.id, integrationId);

    // Step 2: Use the User Access Token to retrieve the Page Access Token
    const { pageAccessToken, pageId } = await this.getPageAccessToken(postId, userAccessToken);

    this.logger.log("Media Type:", createPostDto.mediaType);

    // Step 3: Use the Page Access Token to post the content
    switch (createPostDto.mediaType) {
      case MediaType.TEXT:
        return await this.postContentToFacebook(postId, pageId, post.content, pageAccessToken, createPostDto.scheduled);
      case MediaType.IMAGE:
        const imageUrl = post.postMedia[0]?.mediaUrl; // Assuming a single image
        return await this.postImageToFacebook(postId, pageId, imageUrl, post.content, pageAccessToken);
      case MediaType.MediaCarousel:
        this.logger.log("posting multiple images...", post.postMedia);
        return await this.postMultipleImagesToFacebook(postId, pageId, post.postMedia.map(pm => pm.mediaUrl), post.content, pageAccessToken);
      case MediaType.VIDEO:
        return await this.postVideoToFacebook(postId, pageId, post.postMedia[0]?.mediaUrl, post.content, pageAccessToken);
    }
  }

  private async getPageAccessToken(postId: number, userAccessToken: string): Promise<any> {
    try {
      // Graph API URL to get the list of pages associated with the user
      const url = `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}`;

      // Fetch the pages using axios

      const response = await axios.get(url, {
        headers: { "Accept-Encoding": "gzip,deflate,compress" }
      });

      this.logger.log("response:", response.data);

      // Check if the response has data and at least one page
      if (response.data && response.data.data && response.data.data.length > 0) {
        const page = response.data.data[0]; // Get the first page (or loop to find the desired page)

        const pageAccessToken = page.access_token;
        const pageId = page.id;

        if (pageAccessToken) {
          this.logger.log(`Successfully retrieved Page Access Token: ${pageAccessToken}`);
          return { pageAccessToken, pageId }; // Return the page access token
        } else {
          this.logger.error('No page access token found in the response.');
          throw new Error('Page access token not found.');
        }
      } else {
        this.logger.error('No pages found for this user.');
        throw new Error('No pages found.');
      }

    } catch (error) {
      this.logger.log("Error", error);
      await this.createPostHistory(postId, 'Failed', error, false);
      throw new Error('Failed to retrieve Page Access Token.');
    }
  }

  private async postContentToFacebook(postId: number, pageId: string, message: string, accessToken: string, scheduledTime?: string) {
    const url = `https://graph.facebook.com/v20.0/${pageId}/feed`;
    const payload = {
      message: message,
      published: true
    };

    try {
      const response = await axios.post(url, {
        ...payload,
        access_token: accessToken, // Include access token as a query parameter
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
      });

      this.logger.log('Post published successfully:', response.data);
      await this.createPostHistory(postId, 'Published', `Content Published Successfully`, true);
      return { status: 'Published', id: response.data.id };
    } catch (error) {
      await this.createPostHistory(postId, 'Failed', error, false);
      this.logger.error('Error publishing content to Facebook:', error.response?.data);
      throw new BadRequestException('Failed to publish content to Facebook.');
    }
  }

  private async postImageToFacebook(postId: number, pageId: string, imageUrl: string, message: string, accessToken: string, publish = true): Promise<{ status: string, post_id: string }> {
    const url = `https://graph.facebook.com/v20.0/${pageId}/photos`;

    const payload = {
      url: imageUrl,
      caption: message,
      published: publish,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      this.logger.log('Image posted successfully:', response.data);
      await this.createPostHistory(postId, 'Published', `Image Published Successfully`, true);
      return { status: 'Published', post_id: response.data.id };
    } catch (error) {
      this.logger.error('Error publishing image to Facebook:', error.response?.data);
      await this.createPostHistory(postId, 'Failed', error, false);
      throw new BadRequestException('Failed to publish image to Facebook.');
    }
  }

  private async postMultipleImagesToFacebook(postId: number, pageId: string, imageUrls: string[], message: string, accessToken: string) {
    this.logger.log("In postMultipleImagesToFacebook", imageUrls);
    const imagePromises = imageUrls.map(imageUrl => this.postImageToFacebook(postId, pageId, imageUrl, message, accessToken, false));
    const images = await Promise.all(imagePromises);
    this.logger.log("imageIds:", images);
    const url = `https://graph.facebook.com/v20.0/${pageId}/feed`;

    const data = {
      message: message ?? "",
      access_token: accessToken,
      published: true,
      attached_media: images.map((image, index) => ({ media_fbid: image.post_id }))
    }

    this.logger.log("data:", data);
    
    try {
      const response = await axios.post(url, data);
      this.logger.log("response:", response.data);
    } catch (error) {
      this.logger.log("error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
    return "";
  }

  private async postVideoToFacebook(postId: number, pageId: string, videoUrl: string, description: string, accessToken: string) {
    const url = `https://graph-video.facebook.com/v20.0/${pageId}/videos`;

    const payload = new FormData();
    payload.append('access_token', accessToken);
    payload.append('description', description);
    payload.append('file_url', videoUrl); // Correct parameter for video URL

    try {
      const response = await axios.post(url, payload, {
        headers: {
          ...payload.getHeaders(), // This automatically includes the boundary parameter
        },
      });
      this.logger.log('Video posted successfully:', response.data);
      await this.createPostHistory(postId, 'Published', `Video Published Successfully`, true);
      return { status: 'Published', id: response.data.id };
    } catch (error) {
      this.logger.error('Error publishing video to Facebook:', error.response?.data);
      await this.createPostHistory(postId, 'Failed', error, false);
      throw new BadRequestException('Failed to publish video to Facebook.');
    }
  }

  private async postToLinkedIn(postId: number, integrationId: number, createPostDto: CreatePostDto) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['postMedia', 'user'],
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found.`);
    }
    const mediaType = createPostDto.mediaType;

    this.logger.log('Post:', post);
    Logger.log("Media Type in this.postToLinkedIn", mediaType);

    const accessToken = await this.getAccessToken(post.user.id, integrationId);

    if (!accessToken) {
      throw new BadRequestException('LinkedIn access token is missing for this user.');
    }

    let mediaAssets: any[] = [];
    if (mediaType !== 'Poll') {
      if (post.postMedia && post.postMedia.length > 0) {
        for (const media of post.postMedia) {
          let mediaAsset;
          if (mediaType === 'Document') {
            Logger.log("A document is being uploaded");
            mediaAsset = await this.registerLinkedInDocument(media.mediaUrl, accessToken);
          } else {
            Logger.log("An image/video is being uploaded");
            mediaAsset = await this.registerLinkedInMedia(media.mediaUrl, accessToken, mediaType);
          }
          if (mediaAsset) {
            mediaAssets.push(mediaAsset);
          }
        }
      }
    }
    
    if (mediaAssets.length === 0 && mediaType !== 'Poll') {
      return await this.publishPostToLinkedInContentOnly(createPostDto, postId, post.content || 'Default content text', accessToken);
    } else {
      return await this.publishPostToLinkedInContentWithMedia(post, mediaAssets, accessToken, createPostDto);    
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

  private async registerLinkedInDocument(mediaUrl: string, accessToken: string): Promise<string> {
    try {
      const personUrn = await this.getPersonUrn(accessToken);
      Logger.log("Person URN:", personUrn);
      const response = await axios.post(
        "https://api.linkedin.com/rest/documents?action=initializeUpload", 
        {
          initializeUploadRequest: {
            owner: personUrn
          }
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202409',
          },
        }
      );
      Logger.log("initializeResponse:", response.data.value.document, response.data.value.uploadUrl);
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const documentUploadUrl = response.data.value.uploadUrl;
      const documentAsset = response.data.value.document;
      const documentResponse = await axios.put(documentUploadUrl, mediaResponse.data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': mediaResponse.data.byteLength
        }
      });
      Logger.log(`documentResponse: ${documentResponse.data}`);
      return documentAsset;
    } catch (error) {
      this.logger.error('Error registering or uploading media to LinkedIn:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new BadRequestException('Failed to upload document to LinkedIn.');
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
      Logger.log("Recipe:", recipe);
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
      console.log("1");
      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      console.log("2");
      await axios.put(uploadUrl, mediaResponse.data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': mediaType,
        },
      });
      console.log("3");
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

  private async publishPostToLinkedInContentOnly(createPostDto: CreatePostDto, postId: number, content: string, accessToken: string) {
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
      if (createPostDto.scheduled) {
        await this.createPostHistory(postId, 'Published', `Post Published Successfully, scheduled on ${createPostDto.scheduled}}`, true);
      }
      else {
        await this.createPostHistory(postId, 'Published', 'One Time Post Published Successfully', true);
      }
      return { status: 'Published' };
    } catch (error) {
      if (error.response && error.response.status === 422 && error.response.data.errorDetails?.inputErrors?.[0]?.code === 'DUPLICATE_POST') {
        this.logger.warn('Duplicate post detected:', error.response.data.errorDetails.inputErrors[0].description);
        return { status: 'Duplicate' };
      }
      this.logger.error('Error publishing post to LinkedIn:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      await this.createPostHistory(postId, 'Failed', error, false);
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

      if (mediaType === 'Poll') {
        if (typeof pollObject === 'string') {
          try {
            pollObject = JSON.parse(pollObject);
          } catch (error) {
            this.logger.error('Failed to parse pollObject:', {
              message: error.message,
            });
            await this.createPostHistory(post.id, 'Failed', error, false);
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

      if (mediaType === 'Poll' || mediaType === 'Document') {
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
          content: mediaType === 'Poll' ? {
            "poll": {
              ...pollObject,  // Spread the existing properties of poll
              "settings": {
                "duration": "THREE_DAYS"
              }
            }
          }
          :
          {
            "media": {
              "title": post.content || '',
              "id": mediaAssets[0]
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
              'LinkedIn-Version': '202409',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );

        this.logger.log('Poll published successfully:', response.data);
        await this.createPostHistory(post.id, 'Published', 'Poll Published Successfully', true);
        return { status: "Published" };

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
        await this.createPostHistory(post.id, 'Published', `Post of media type ${createPostDto.mediaType} Published Successfully`, true);
        return { status: "Published" };
      }
    } catch (error) {
      this.logger.error('Error publishing post to LinkedIn:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      await this.createPostHistory(post.id, 'Failed', error, false);
      throw new BadRequestException('Failed to publish post to LinkedIn.');
    }
  }

  async getPostsForUser(userId: number): Promise<Post[]> {
    const posts = await this.postRepository
      .find({
        where: {
          user: {
            id: userId
          }
        },
        order: {
          createdAt: "DESC"
        },
        relations: [
          "integration",
          "postMedia",
          "postHistory"
        ]
      });
    return posts.map(post => ({ ...post, recurringDetails: this.getRecurringDetails(post.cronFormat) }));
  }

  // async getPostsForUser(userId: number) {
  //   const posts = await this.postRepository
  //     .createQueryBuilder('post')
  //     .leftJoinAndSelect('post.integration', 'integration')
  //     .leftJoinAndSelect('post.postMedia', 'postMedia')
  //     .leftJoinAndSelect('post.postHistory', 'postHistory')
  //     .where('post.user_id = :userId', { userId })
  //     .select([
  //       'post.id',
  //       'post.content',
  //       'post.recurring',
  //       'post.scheduled',
  //       'post.cronFormat',
  //       'integration.platform',
  //       'integration.icon',
  //       'postMedia.mediaUrl',
  //     ])
  //     .addSelect('SUM(CASE WHEN postHistory.success = true THEN 1 ELSE 0 END)', 'successTrueCount')
  //     .addSelect('SUM(CASE WHEN postHistory.success = false THEN 1 ELSE 0 END)', 'successFalseCount')
  //     .groupBy('post.id')
  //     .addGroupBy('integration.platform')
  //     .addGroupBy('integration.icon')
  //     .addGroupBy('postMedia.mediaUrl')
  //     .orderBy('post.id', 'DESC')  // Sort in descending order by post.id
  //     .getRawMany();

  //   return posts.map(post => {
  //     // Determine recurring type and additional details
  //     const recurringDetails = this.getRecurringDetails(post.post_cronFormat);

  //     // Format history counts as "successTrueCount / successFalseCount"
  //     const formattedHistoryCount = `${post.successTrueCount || 0}/${post.successFalseCount || 0}`;

  //     return {
  //       ...post,
  //       recurringType: recurringDetails.type,
  //       date_day: recurringDetails.date_day,
  //       historyCount: formattedHistoryCount, // Format history counts as requested
  //     };
  //   });
  // }

  private getRecurringDetails(cronFormat: string) {
    if (!cronFormat) return { type: null, dayOfWeek: null, dateOfMonth: null };

    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronFormat.split(' ');

    let type = 'Daily'; // Default to daily if no specific recurring type is found
    let date_day = null;
    // Check if the cron format specifies daily recurrence
    if (dayOfMonth === '*' && month === '*' && (dayOfWeek === '*' || dayOfWeek === '?')) {
      // This indicates a daily schedule
      type = 'Daily';
    } else if (dayOfMonth !== '*' && dayOfMonth !== '?') {
      // Specific day of the month provided, so it's a monthly schedule
      type = 'Monthly';
      date_day = dayOfMonth.split(',').map(Number).toString();
    } else if (dayOfWeek !== '*' && dayOfWeek !== '?') {
      // Specific day of the week provided, so it's a weekly schedule
      type = 'Weekly';
      const dayNumbers = dayOfWeek.split(',').map(Number);

      // Handle single day case
      if (dayNumbers.length === 1) {
        if (dayNumbers[0] === 0) date_day = "Sunday";
        else if (dayNumbers[0] === 1) date_day = "Monday";
        else if (dayNumbers[0] === 2) date_day = "Tuesday";
        else if (dayNumbers[0] === 3) date_day = "Wednesday";
        else if (dayNumbers[0] === 4) date_day = "Thursday";
        else if (dayNumbers[0] === 5) date_day = "Friday";
        else if (dayNumbers[0] === 6) date_day = "Saturday";
        else date_day = 'Unknown'; // Handle unexpected values
      }
    }
    return { type, date_day };
  }

}
