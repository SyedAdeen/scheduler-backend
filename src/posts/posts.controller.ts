import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express'; // Correct import
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './services/posts.service';
import { GetPostTypesDto } from './dtos/get-post-types.dto';
import { CreatePostDto, DayOfWeek, MediaType, RecurringType } from './dtos/create-post.dto';
import { plainToClass } from 'class-transformer';


@Controller('')
@ApiTags('Posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('integrations/:integrationId/post-types')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Post Types for a specific integration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 200,
    description: 'List of post types for the integration',
    type: [GetPostTypesDto],
  })
  async getPostTypesForIntegration(
    @Param('integrationId') integrationId: number
  ): Promise<GetPostTypesDto[]> {
    const postTypes = await this.postsService.getPostTypesForIntegration(integrationId);
    return postTypes;
  }

  @Post('/posts')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Failed to publish the post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'Media Carousel', maxCount: 5 },
    { name: 'Image', maxCount: 1 },
    { name: 'Video', maxCount: 1 },
    { name: 'Document', maxCount: 1 },
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        integrationId: { type: 'number' },
        content: { type: 'string' },
        recurring: { type: 'boolean' },
        scheduled: { type: 'string', format: 'date-time', nullable: true },
        mediaType: { 
          type: 'string', 
          enum: Object.values(MediaType),
          description: 'Type of media being uploaded. Use this field to determine which files are relevant.' 
        },
        recurring_type: { 
          type: 'string', 
          enum: Object.values(RecurringType),
          description: 'Recurring type of the post, e.g., Daily, Weekly, Monthly', 
          nullable: true 
        },
        dayofweek: { 
          type: 'string', 
          enum: Object.values(DayOfWeek),
          description: 'Day of the week for weekly recurring posts', 
          nullable: true 
        },
        dateofmonth: { 
          type: 'number', 
          description: 'Date of the month for monthly recurring posts', 
          nullable: true 
        },
        poll: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            options: {
              type: 'array',
              items: { 
                type: 'object',
                properties: {
                  text: { type: 'string' }
                }
              }
            }
          }
        },
        'Media Carousel': {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Array of image files (up to 5). Only relevant if mediaType is "Media Carousel".'
        },
        'Image': {
          type: 'string',
          format: 'binary',
          description: 'Single image file. Only relevant if mediaType is "Image".'
        },
        'Video': {
          type: 'string',
          format: 'binary',
          description: 'Video file (only one allowed). Only relevant if mediaType is "Video".'
        },
        'Document': {
          type: 'string',
          format: 'binary',
          description: 'Document (only one allowed).'
        },
      }, 
    },
  })
  async createPost(
    @Body() body: any,
    @UploadedFiles() files: {
      'Media Carousel'?: Express.Multer.File[],
      'Image'?: Express.Multer.File[],
      'Video'?: Express.Multer.File[],
      'Document'?: Express.Multer.File[],
    },
    @Req() request: any
  ): Promise<{ message: string }> {
    const user = request.user;
    // Convert body to DTO
    body.recurring = body.recurring === 'true';
    const createPostDto = plainToClass(CreatePostDto, body, { enableImplicitConversion: true });
    createPostDto.recurring=body.recurring; 
    // Handle file upload and media type logic
    let mediaFiles: Express.Multer.File[] = [];
    switch (createPostDto.mediaType) {
      case MediaType.MediaCarousel:
        mediaFiles = files['Media Carousel'] || [];
        break;
      case MediaType.IMAGE:
        mediaFiles = Array.isArray(files?.['Image']) ? files['Image'] : files?.['Image'] ? [files['Image']] : [];
        break;
      case MediaType.VIDEO:
        mediaFiles = Array.isArray(files['Video']) ? files['Video'] : files['Video'] ? [files['Video']] : [];
        break;
      case MediaType.DOCUMENT:
        mediaFiles = Array.isArray(files['Document']) ? files['Document'] : files['Document'] ? [files['Document']] : [];
        break;
      case MediaType.POLL:
        // No files for polls
        break;
      default:
        break;
    }
    // Call the service method with the necessary data
    return this.postsService.createPost(user.id, body.integrationId, createPostDto, mediaFiles);    
  }

}
