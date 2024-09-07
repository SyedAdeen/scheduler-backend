import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ description: 'The content of the post' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether the post is recurring', default: false })
  @IsBoolean()
  @Transform(({ value }) => value === 'true', { toClassOnly: true })
  recurring: boolean;

  @ApiProperty({ description: 'Media Type of post' })
  @IsString()
  mediaType: string;

  @ApiProperty({ description: 'The scheduled date for the post', required: false, type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || undefined) // Ensures empty string is converted to undefined
  scheduled?: string;
}
