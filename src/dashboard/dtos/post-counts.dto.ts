import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum RecurringType {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
}

export class PostCountsDto {
    @ApiProperty({ enum: RecurringType, description: 'Recurring type (Daily, Weekly, Monthly)' })
    @IsEnum(RecurringType)
    recurringType: RecurringType;
}
