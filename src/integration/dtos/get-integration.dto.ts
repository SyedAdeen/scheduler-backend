import { ApiProperty } from '@nestjs/swagger';

export class IntegrationDto {
  @ApiProperty()
  integrationId: number; 
}
