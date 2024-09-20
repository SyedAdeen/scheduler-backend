import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../services/posts.service';

@Processor('post-scheduler')
export class PostQueueProcessor {
  constructor(private readonly postsService: PostsService) {}

  // Process jobs of type 'schedule-post'
  @Process({ name: 'schedule-post', concurrency: 1 })
  async handlePostSchedule(job: Job) {
    const { postId, integrationId, createPostDto } = job.data;

    // Call the method to publish the post
    return this.postsService.postToPlatform(postId, integrationId, createPostDto);
  }
}
