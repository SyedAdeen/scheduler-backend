import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/auth.service";
import { User } from "@entities/user.entity";
import { LocalUserStrategy } from "./strategies/local-user.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({}),
        TypeOrmModule.forFeature([User]),
    ],
    controllers: [AuthController],
    providers: [
        LocalUserStrategy,
        JwtStrategy,
        AuthService,
    ],
    exports:[AuthService]
})
export class AuthModule {}
