import { BadRequestException, Injectable, Logger, NotFoundException, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationPostsTypes } from '../../common/database/entities/integration-posts-types.entity';
import { Post } from '../../common/database/entities/post.entity';
import { PostMedia } from '../../common/database/entities/post-media.entity';
import { UserIntegration } from '../../common/database/entities/user-integration.entity';
import { Integration } from '@entities/integration.entity';
import { v2 as Cloudinary } from 'cloudinary';
import { classToPlain } from 'class-transformer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PostHistory } from '@entities/post-history.entity';
import * as FormData from 'form-data'

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

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
}