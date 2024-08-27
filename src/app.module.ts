import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import dataBaseConfig from "./common/database/ormconfig";
import { AuthModule } from "./auth/auth.module";
<<<<<<< Updated upstream
import { MailerModule, MailerService } from "@nestjs-modules/mailer";
import { createClient } from "@redis/client";
=======
import { IntegrationModule } from "./integration/integration.module";
import { MailerModule } from "@nestjs-modules/mailer";
import { createClient } from "@redis/client";
import { OAuth2Client } from 'google-auth-library'; // Import the Google client
import { UtilitiesModule } from './common/utilities/utilities.module';

>>>>>>> Stashed changes

@Global()
@Module({
    imports: [
<<<<<<< Updated upstream
        MailerModule.forRoot({
            transport: {
                host: process.env.SEND_GRID_HOST,
                secure: false,
                auth: {
                    user: process.env.SEND_GRID_USERNAME,
                    pass: process.env.SEND_GRID_PASSWORD,
                },
            },
        }),
        ConfigModule.forRoot({ isGlobal: true }),
=======
        ConfigModule.forRoot({ isGlobal: true }), // Ensure ConfigModule is global
>>>>>>> Stashed changes
        TypeOrmModule.forRoot(dataBaseConfig.options),
        ScheduleModule.forRoot(),
        AuthModule,
        IntegrationModule,
        UtilitiesModule,  
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('EMAIL_HOST'),
                    port: Number(configService.get<string>('EMAIL_PORT')),
                    secure: false, 
                    auth: {
                        user: configService.get<string>('EMAIL_USER'),
                        pass: configService.get<string>('EMAIL_PASS'),
                    },
                },
            }),
        }),
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
    ],
    exports: [
<<<<<<< Updated upstream
        "REDIS"
=======
        "REDIS",
        'GOOGLE_CLIENT', 
>>>>>>> Stashed changes
    ]
})
export class AppModule {}
