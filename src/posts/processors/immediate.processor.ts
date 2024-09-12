import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dtos/create-post.dto';

@Processor('post-scheduler')
export class PostImmediateProcessor {
  constructor(private readonly postsService: PostsService) {}

  @Process('post-immediate')
  async handleImmediatePost(job: Job<{ postId: number; integrationId: number; createPostDto: CreatePostDto }>) {
    const { postId, integrationId, createPostDto } = job.data;

    // Call the method to post immediately
    const result = this.postsService.postToPlatform(postId, integrationId, createPostDto);
    // If the result contains a duplicate post message, return it
    if ((await result).message === 'Duplicate post detected. Post was not published again.') {
      return { message: 'Duplicate post detected. Post was not published again.' };
    }

    return result;
  }
}
