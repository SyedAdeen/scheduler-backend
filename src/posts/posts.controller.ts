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
  HttpException,
  HttpStatus,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express'; // Correct import
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './services/posts.service';
import { GetPostTypesDto } from './dtos/get-post-types.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { Request } from 'express';


@Controller('integrations/:integrationId/post-types')
@ApiTags('Posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
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

  // @Post('create')
  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Create a new post' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 201, description: 'Post created successfully' })
  // async createPost(
  //   @Param('integrationId') integrationId: number,
  //   @Body() createPostDto: CreatePostDto
  // ): Promise<void> {
  //   try {
  //     await this.postsService.createPost(integrationId, createPostDto);
  //   } catch (error) {
  //     throw new HttpException('Error creating post', HttpStatus.BAD_REQUEST);
  //   }
  // }

  // @Post(':postId/upload')
  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Upload media for a specific post' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 200, description: 'Media uploaded successfully' })
  // @UseInterceptors(FileFieldsInterceptor([
  //   { name: 'images', maxCount: 10 },
  //   { name: 'videos', maxCount: 1 },
  // ]))
  // async uploadMedia(
  //   @Param('postId') postId: number,
  //   @UploadedFiles() files: { images?: Express.Multer.File[], videos?: Express.Multer.File[] }
  // ): Promise<void> {
  //   if (!files.images && !files.videos) {
  //     throw new BadRequestException('No files provided');
  //   }
    
  //   const mediaFiles = [...(files.images || []), ...(files.videos || [])];
  //   await this.postsService.uploadMedia(postId, mediaFiles);
  // }


  @Post('create/:integrationId')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Create a new post' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 201, description: 'Post created successfully' })
@UseInterceptors(FileFieldsInterceptor([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 1 },
]))
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      recurring: { type: 'boolean' },
      scheduled: { type: 'string', format: 'date-time', nullable: true },
      images: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
      },
      videos: {
        type: 'string', format: 'binary',
      },
    },
  },
})
async createPost(
  @Param('integrationId') integrationId: number,
  @Body() body: any,
  @UploadedFiles() files: { images?: Express.Multer.File[], videos?: Express.Multer.File[] },
  @Req() request: any
): Promise<void> {
  const user = request.user;
  
  // Manually convert recurring to boolean
  const createPostDto = new CreatePostDto();
  createPostDto.content = body.content;
  createPostDto.recurring = body.recurring === 'true'; // Convert 'true'/'false' to boolean
  createPostDto.scheduled = body.scheduled || undefined; // Keep as undefined if empty

  // Combine images and video into a single array of media files
  const mediaFiles: Express.Multer.File[] = [
    ...(files.images || []),
    ...(Array.isArray(files.videos) ? files.videos : files.videos ? [files.videos] : [])
  ];

  // Call the service method with the necessary data
  await this.postsService.createPost(user.id, integrationId, createPostDto, mediaFiles);
}

  @Post(':postId/upload')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload media for a specific post' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 200, description: 'Media uploaded successfully' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'media', maxCount: 10 },
  ]))
  async uploadMedia(
    @Param('postId') postId: number,
    @UploadedFiles() files: { media?: Express.Multer.File[] }
  ): Promise<void> {
    if (!files || !files.media) {
      throw new BadRequestException('No media files provided');
    }
    
    const mediaFiles = files.media;
    await this.postsService.uploadMedia(postId, mediaFiles);
  }
}
