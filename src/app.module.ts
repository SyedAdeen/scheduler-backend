import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import dataBaseConfig from "./common/database/ormconfig";
import { AuthModule } from "./auth/auth.module";
import { MailerModule, MailerService } from "@nestjs-modules/mailer";
import { createClient } from "@redis/client";

@Global()
@Module({
    imports: [
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
    ],
    exports: [
        "REDIS"
    ]
})
export class AppModule {}
