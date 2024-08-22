import { ApiProperty } from "@nestjs/swagger";

export class VerifyDto {
    @ApiProperty()
    token: string;

    @ApiProperty()
    code: number;

}