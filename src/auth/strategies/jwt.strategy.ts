import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../services/auth.service";
import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get("JWT_SECRET"),
            algorithms: ['HS256'], // This should match the algorithm used for signing the token

        });
    }

    async validate(payload: { id: number }) {
        Logger.log("JwtStrategy: Payload received", payload);
        const user = await this.authService.getById(payload.id);
        if (!user) {
            throw new UnauthorizedException("User not found");
        }
        return user;
    }
}


