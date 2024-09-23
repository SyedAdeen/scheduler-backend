import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@entities/post.entity';
import { PostHistory } from '@entities/post-history.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(PostHistory)
        private readonly postHistoryRepository: Repository<PostHistory>
    ) {}

    async getPostCountsForIntegration(
        userId: number,
        integrationId: number,
        startDate: string,
        endDate: string
    ): Promise<any> {
        // Get post counts for the specified integration and time range
        const postCounts = await this.postRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.integration', 'integration')
        .select('integration.platform', 'platform')
        .addSelect('post.postType', 'postType')
        .addSelect('COUNT(post.id)', 'postCount')
        .where('post.user_id = :userId', { userId })
        .andWhere('post.integration_id = :integrationId', { integrationId })
        .andWhere('post.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('integration.platform')
        .addGroupBy('post.postType')
        .getRawMany();

    // Get post history counts for the specified integration and time range
    const postHistoryCounts = await this.postHistoryRepository.createQueryBuilder('postHistory')
        .leftJoin('postHistory.post', 'post')
        .select('post.integration_id', 'integrationId')
        .addSelect('post.postType', 'postType') 
        .addSelect('COUNT(CASE WHEN postHistory.success = true THEN 1 END)', 'successCount')
        .addSelect('COUNT(CASE WHEN postHistory.success = false THEN 1 END)', 'failureCount')
        .where('post.user_id = :userId', { userId })
        .andWhere('post.integration_id = :integrationId', { integrationId })
        .andWhere('postHistory.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('post.integration_id')
        .addGroupBy('post.postType')
        .getRawMany();

        const formattedResponse = {
            platform: postCounts.length > 0 ? postCounts[0].platform : null, // Assuming the platform is the same for all
            postCounts: postCounts.map(post => ({
                postType: post.postType,
                postCount: post.postCount,
            })),
            postHistoryCounts: postHistoryCounts.map(history => ({
                postType: history.postType,
                successCount: history.successCount,
                failureCount: history.failureCount,
            })),
        };
    
        return formattedResponse;
    }
}
