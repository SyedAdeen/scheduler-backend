import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IntegrationController } from "./integration.controller";
import { IntegrationService } from "./services/integration.service";
import { Integration } from '@entities/integration.entity';
import { UserIntegration } from '@entities/user-integration.entity';
import { MailerService } from "../common/services/MailService";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forFeature([Integration, UserIntegration]),
    ],
    controllers: [IntegrationController],
    providers: [
        IntegrationService,
        MailerService
    ],
    exports: [IntegrationService]
})
export class IntegrationModule {}
