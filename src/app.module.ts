import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import dataBaseConfig from "./common/database/ormconfig";
import { AuthModule } from "./auth/auth.module";
import { MailerModule} from "@nestjs-modules/mailer";
import { createClient } from "@redis/client";
import { OAuth2Client } from 'google-auth-library'; // Import the Google client


@Global()
@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                secure: false, // Set to true if you use port 465
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            },
        }),
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot(dataBaseConfig.options),
        ScheduleModule.forRoot(),
        AuthModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            inject: [ConfigService],
            provide: "REDIS",
            useFactory: async (configService: ConfigService) => {
                const client = createClient({
                    url: configService.get<string>("REDIS_URL"),
                    username: configService.get<string>("REDIS_USERNAME"),
                    password: configService.get<string>("REDIS_PASSWORD"),
                });
                await client.connect();
                return client;
            },
        },
        {
            provide: 'GOOGLE_CLIENT',
            useFactory: (configService: ConfigService) => {
                return new OAuth2Client(configService.get<string>('GOOGLE_CLIENT_ID'));
            },
            inject: [ConfigService],
        },
    ],
    exports: [
        "REDIS",
        'GOOGLE_CLIENT', // Export the Google client for use in other modules
    ]
})
export class AppModule {}
