import { IsEnum, IsOptional, IsBoolean, IsDateString, ValidateNested, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

// Define the enum in the same file
export enum MediaType {
  IMAGE = 'Image',
  VIDEO = 'Video',
  DOCUMENT = 'Document',
  POLL = 'Poll',
  MediaCarousel = 'Media Carousel'
}

export enum RecurringType {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

export enum PostStatus {
  PUBLISHED = 'Published',
  DUPLICATE = 'Duplicate',
  FAILED = 'Failed',
}

// Define day of the week enum
export enum DayOfWeek {
  SUNDAY = 'Sunday',
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
}

class PollOptionDto {
  @ApiProperty({ description: 'Text of the poll option' })
  @IsString()
  text: string;
}

class PollDto {
  @ApiProperty({ description: 'Poll question' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Poll options', type: [PollOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options: PollOptionDto[];
}

export class CreatePostDto {
  @ApiProperty({ description: 'The content of the post' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether the post is recurring', default: false })
  @IsBoolean()
  @Transform(({ value }) => value === 'true', { toClassOnly: true })
  recurring: boolean;

  @ApiProperty({ description: 'Media Type of post', enum: MediaType })
  @IsEnum(MediaType)  
  mediaType: MediaType;

  @ApiProperty({ description: 'The scheduled date for the post', required: false, type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  scheduled?: string;

  @ApiProperty({ description: 'The Recurring Type for the Post', enum: RecurringType, required: false })
  @IsOptional()
  @IsEnum(RecurringType)
  recurring_type?: RecurringType;

  @ApiProperty({ description: 'Day of the week for recurring weekly posts', enum: DayOfWeek, required: false })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayofweek?: DayOfWeek;

  @ApiProperty({ description: 'Date of the month for recurring monthly posts', required: false, type: 'string' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  dateofmonth?: number;

  @ApiProperty({ description: 'Poll object', type: PollDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PollDto)
  poll?: PollDto;
}
