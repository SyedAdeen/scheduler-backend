import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Integration } from "@entities/integration.entity";
import { UserIntegration } from "@entities/user-integration.entity";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,

    @InjectRepository(UserIntegration)
    private readonly userIntegrationRepository: Repository<UserIntegration>,

    private readonly configService: ConfigService,

  ) {}

  
  async getIntegrationsForUser(userId: number): Promise<any[]> {
    const queryBuilder = this.integrationRepository
    .createQueryBuilder('integration')
    .leftJoinAndSelect(
      'integration.userIntegrations', // Table name for UserIntegration
      'userIntegrations',
      'userIntegrations.integration_id = integration.id AND userIntegrations.user_id = :userId AND userIntegrations.deleted_at IS NULL',
      { userId }
    )
  
    // Log the SQL query and parameters
    const [query, parameters] = queryBuilder.getQueryAndParameters();
    Logger.log('Generated Query:', query);
    Logger.log('Query Parameters:', parameters);
  
    return queryBuilder.getMany();
  }

      
}
