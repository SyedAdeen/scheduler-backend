import { Module } from '@nestjs/common';
import { PostsService } from './services/posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostType } from '../common/database/entities/post-type.entity';
import { IntegrationPostsTypes } from '../common/database/entities/integration-posts-types.entity';
import { Integration } from '../common/database/entities/integration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostType, IntegrationPostsTypes, Integration])
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
