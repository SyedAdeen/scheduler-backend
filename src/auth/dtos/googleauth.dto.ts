import { ApiProperty } from "@nestjs/swagger";

export class GoogleAuthDto {
    @ApiProperty()
    idToken: string;

}