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
    return this.postsService.postToPlatform(postId, integrationId, createPostDto);
  }
}
