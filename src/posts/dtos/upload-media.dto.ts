import { IsNumber } from 'class-validator';

export class UploadMediaDto {
  @IsNumber()
  postId: number;
}
