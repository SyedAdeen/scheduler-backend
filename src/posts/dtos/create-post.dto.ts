import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'The content of the post' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether the post is recurring', default: false })
  @IsBoolean()
  recurring: boolean;

  @ApiProperty({ description: 'The scheduled date for the post', required: false, type: 'string', format: 'date-time' })
  @IsOptional()
  @IsString()
  scheduled?: string;
}
