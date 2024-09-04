import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './services/posts.service';
import { IntegrationPostsTypes } from '../common/database/entities/integration-posts-types.entity';
import { instanceToPlain } from 'class-transformer';

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
    type: [IntegrationPostsTypes],
  })
  async getPostTypesForIntegration(
    @Param('integrationId') integrationId: string
  ) {
    const postTypes = await this.postsService.getPostTypesForIntegration(integrationId);
    return postTypes;
  }
}
