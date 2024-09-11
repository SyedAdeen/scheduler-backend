import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../services/posts.service';

@Processor('post-scheduler')
export class PostQueueProcessor {
  constructor(private readonly postsService: PostsService) {}

  @Process('schedule-post')
  async handlePostSchedule(job: Job) {
    const { postId, integrationId, createPostDto } = job.data;

    // Call the method to publish the post
    await this.postsService.postToPlatform(postId, integrationId, createPostDto);
  }
}
