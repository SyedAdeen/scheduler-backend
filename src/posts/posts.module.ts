import { Module } from '@nestjs/common';
import { PostsService } from './services/posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostType } from '../common/database/entities/post-type.entity';
import { IntegrationPostsTypes } from '../common/database/entities/integration-posts-types.entity';
import { Integration } from '../common/database/entities/integration.entity';
import { PostMedia } from '@entities/post-media.entity';
import { Post } from '@entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostType, IntegrationPostsTypes, Integration, Post, PostMedia])
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
