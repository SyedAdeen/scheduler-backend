import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../services/auth.service";
import { User } from "@entities/user.entity";

@Injectable()
export class LocalUserStrategy extends PassportStrategy(
    Strategy,
    "local-user",
) {
    constructor(private authService: AuthService) {
        super();
    }

    async validate(email: string, password: string): Promise<User> {
        const user = await this.authService.validate(email, password);
        if (!user) {
            throw new UnauthorizedException("Invalid username/password");
        }
        return user;
    }
}
