import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import dataBaseConfig from './common/database/ormconfig';
import { AuthModule } from './auth/auth.module';
import { IntegrationModule } from './integration/integration.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { createClient } from '@redis/client';
import { OAuth2Client } from 'google-auth-library';
import { UtilitiesModule } from './common/utilities/utilities.module';
import { PostsModule } from './posts/posts.module';
import { v2 as cloudinary } from 'cloudinary';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }), // Ensure ConfigModule is global
        TypeOrmModule.forRoot(dataBaseConfig.options),
        ScheduleModule.forRoot(),
        AuthModule,
        IntegrationModule,
        PostsModule,
        UtilitiesModule,
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('EMAIL_HOST'),
                    port: Number(configService.get<string>('EMAIL_PORT')),
                    secure: false, // Set to true if you use port 465
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
            provide: 'REDIS',
            useFactory: async (configService: ConfigService) => {
                const client = createClient({
                    url: configService.get<string>('REDIS_URL'),
                    username: configService.get<string>('REDIS_USERNAME'),
                    password: configService.get<string>('REDIS_PASSWORD'),
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
        {
            provide: 'CLOUDINARY',
            useFactory: (configService: ConfigService) => {
                cloudinary.config({
                    cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
                    api_key: configService.get<string>('CLOUDINARY_API_KEY'),
                    api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
                });
                return cloudinary;
            },
            inject: [ConfigService],
        },
    ],
    exports: [
        'REDIS',
        'GOOGLE_CLIENT', 
        'CLOUDINARY', 
    ],
})
export class AppModule {}
