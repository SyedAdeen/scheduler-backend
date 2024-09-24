import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostType } from '../common/database/entities/post-type.entity';
import { IntegrationPostsTypes } from '../common/database/entities/integration-posts-types.entity';
import { Integration } from '../common/database/entities/integration.entity';
import { PostMedia } from '@entities/post-media.entity';
import { Post } from '@entities/post.entity';
import { PostHistory } from '@entities/post-history.entity';
import { UserIntegration } from '@entities/user-integration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostType, IntegrationPostsTypes, Integration, Post, PostMedia, UserIntegration, PostHistory]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
