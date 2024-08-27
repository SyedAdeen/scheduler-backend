import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/auth.service";
import { User } from '../common/database/entities/user.entity';
import { LocalUserStrategy } from "./strategies/local-user.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
<<<<<<< Updated upstream
=======
import { MailerService } from "../common/services/MailService";
>>>>>>> Stashed changes

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },  // Set your preferred expiry
            }),
        }),
        TypeOrmModule.forFeature([User]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
<<<<<<< Updated upstream
=======
        JwtStrategy,
        LocalUserStrategy,
        MailerService,
>>>>>>> Stashed changes
    ],
    exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
