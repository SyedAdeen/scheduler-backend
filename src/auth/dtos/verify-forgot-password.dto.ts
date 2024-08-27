import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordVerifyDto {
    @ApiProperty()
    token: string;

    @ApiProperty()
    newPassword: string;

    @ApiProperty()
    code: number;
}
