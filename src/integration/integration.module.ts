import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IntegrationController } from "./integration.controller";
import { IntegrationService } from "./services/integration.service";
import { Integration } from '@entities/integration.entity';
import { UserIntegration } from '@entities/user-integration.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forFeature([Integration, UserIntegration]),
    ],
    controllers: [IntegrationController],
    providers: [
        IntegrationService,
    ],
    exports: [IntegrationService]
})
export class IntegrationModule {}
