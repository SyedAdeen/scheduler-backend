import { ApiProperty } from '@nestjs/swagger';

export class GetPostTypesDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Text' })
  name: string;
}
