import { ApiProperty } from "@nestjs/swagger";

export class VerifyRegisterDto {
    @ApiProperty()
    token: string;

    @ApiProperty()
    code: number;

}