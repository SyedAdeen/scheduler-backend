import { ApiProperty } from "@nestjs/swagger";

export class GetIntegrationDto {
    @ApiProperty()
    userId: number;
}
