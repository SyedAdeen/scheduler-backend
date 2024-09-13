import { Module } from '@nestjs/common';
import { PostsService } from './services/posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostType } from '../common/database/entities/post-type.entity';
import { IntegrationPostsTypes } from '../common/database/entities/integration-posts-types.entity';
import { Integration } from '../common/database/entities/integration.entity';
import { PostMedia } from '@entities/post-media.entity';
import { Post } from '@entities/post.entity';
import { PostHistory } from '@entities/post-history.entity';
import { UserIntegration } from '@entities/user-integration.entity';
import { PostQueueProcessor } from './processors/post-que.processor'; // Ensure the correct filename
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostType, IntegrationPostsTypes, Integration, Post, PostMedia, UserIntegration, PostHistory]),
    BullModule.registerQueue({
      name: 'post-scheduler',
    }),
  ],
  providers: [PostsService, PostQueueProcessor],
  controllers: [PostsController],
  exports: [PostsService, PostQueueProcessor],
})
export class PostsModule {}
