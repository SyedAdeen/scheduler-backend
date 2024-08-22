import { ApiProperty } from "@nestjs/swagger";

export class GoogleAuthDto {
    @ApiProperty()
    id_token: string;

}