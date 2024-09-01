import { Module } from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IntegrationController } from "./integration.controller";
import { EncryptionService } from "src/common/utilities/encryption.utlis";
import { IntegrationService } from "./services/integration.service";
import { Integration } from '@entities/integration.entity';
import { UserIntegration } from '@entities/user-integration.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule,
        TypeOrmModule.forFeature([Integration, UserIntegration]),
    ],
    controllers: [IntegrationController],
    providers: [
        IntegrationService,EncryptionService
    ],
    exports: [IntegrationService,EncryptionService]
})
export class IntegrationModule {}
