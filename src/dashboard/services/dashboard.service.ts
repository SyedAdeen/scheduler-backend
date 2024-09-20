import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@entities/post.entity';
import { PostHistory } from '@entities/post-history.entity';
import { Integration } from '@entities/integration.entity';
import { User } from '@entities/user.entity';


@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(PostHistory) private readonly postHistoryRepository: Repository<PostHistory>,
    @InjectRepository(Integration) private readonly integrationRepository: Repository<Integration>,
  ) {}

  async getPostCountsForIntegration(userId: number, recurringType: string) {
    // Count of posts by cronFormat (Daily, Weekly, Monthly)
    const postCounts = await this.postRepository.createQueryBuilder('post')
      .select('post.cronFormat, COUNT(post.id) as count')
      .where('post.user.id = :userId', { userId }) 
      .andWhere('post.cronFormat = :recurringType', { recurringType }) // Filter by recurring type
      .groupBy('post.cronFormat')
      .getRawMany();
  
    const postCountsByType = {
      Daily: 0,
      Weekly: 0,
      Monthly: 0,
    };
  
    postCounts.forEach(post => {
      if (post.cronFormat === '0 0 * * *') postCountsByType.Daily = post.count;
      else if (post.cronFormat === '0 0 * * 0') postCountsByType.Weekly = post.count;
      else if (post.cronFormat === '0 0 1 * *') postCountsByType.Monthly = post.count;
    });
  
    // Get post history counts (Success and Failure) grouped by post's integration_id
    const postHistoryCounts = await this.postHistoryRepository.createQueryBuilder('post_history')
      .select('post.integration_id, SUM(CASE WHEN post_history.success = true THEN 1 ELSE 0 END) AS successCount, SUM(CASE WHEN post_history.success = false THEN 1 ELSE 0 END) AS failureCount')
      .innerJoin('post_history.post', 'post') // Join post_history with post
      .where('post.user.id = :userId', { userId }) // Filter by user ID
      .groupBy('post.integration_id') // Group by integration_id from the Post table
      .getRawMany();
  
    // Get integration information
    const integrations = await this.integrationRepository.find();
  
    // Format the response
    const response = integrations.map(integration => {
      const history = postHistoryCounts.find(ph => ph.integration_id === integration.id) || { successCount: 0, failureCount: 0 };
      return {
        integration: integration.platform,
        postCounts: postCountsByType,
        successCount: history.successCount,
        failureCount: history.failureCount,
      };
    });
  
    return response;
  }

}