import { BadRequestException, Injectable, Logger, NotFoundException, Scope } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Integration } from "@entities/integration.entity";
import { UserIntegration } from "@entities/user-integration.entity";
import { ConfigService } from "@nestjs/config";
import { EncryptionService } from '../../common/utilities/encryption.utlis';

@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,

    @InjectRepository(UserIntegration)
    private readonly userIntegrationRepository: Repository<UserIntegration>,

    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly httpservice : HttpService
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
 
  async generateAuthUrl(userId: number, integrationId: number): Promise<string> {
    // Find the integration based on the provided ID
    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    // Define your client ID and redirect URL (You might want to fetch these from the integration entity or config)
    const clientId = this.encryptionService.decrypt(integration.metadata.clientId);
    const redirectUri= integration.metadata.redirectUri;
    const oauthUri = integration.metadata.oauthUri;

    // Create a state object containing the userId and integrationId
    const state = JSON.stringify({ userId, integrationId });
    const host = this.configService.get<string>('HOST', '127.0.0.1'); 
    const port = this.configService.get<string>('PORT', '3001'); 
    const scope = integration.metadata.scope;

    // Construct the dynamic redirect_uri
    const redirect_uri = `${host}:${port}${redirectUri}`;

    // Generate the authorization URL
    const authUrl = `${oauthUri}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;

    return authUrl;
  }

  async deleteUserIntegration(userId: number, integrationId: number): Promise<boolean> {
    // Find the integration based on the provided ID
    const result = await this.userIntegrationRepository.delete({
      integration:{id:integrationId},
      user:{id:userId}
    });
    
    if (result.affected === 0) {
      throw new NotFoundException(`No UserIntegration found with Integration ID: ${integrationId} and User ID: ${userId}`);
    }

    return result.affected>0;
  }

  
  async exchangeCodeForTokens(code: string, userId: number, integrationId: number): Promise<UserIntegration> {
    // Find the integration based on the provided ID
    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    const tokenUri = integration.metadata.tokenUri; // LinkedIn token endpoint
    const clientId = this.encryptionService.decrypt(integration.metadata.clientId);
    const clientSecret = this.encryptionService.decrypt(integration.metadata.clientSecret);
    const redirectUri = integration.metadata.redirectUri;
    const host = this.configService.get<string>('HOST', '127.0.0.1'); 
    const port = this.configService.get<string>('PORT', '3001'); 
    const redirect_uri = `${host}:${port}${redirectUri}`;
 
    // Make the request to exchange code for tokens
    try {
      const response = await this.httpservice
        .post(tokenUri, new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        })
        .toPromise();

      const { access_token, refresh_token, expires_in } = response.data;

      // Find the user's integration record and update it
      let userIntegration = await this.userIntegrationRepository.findOne({
        where: { user: { id: userId }, integration: { id: integrationId } },
      });

      if (userIntegration) {
        throw new BadRequestException('UserIntegration found');
      }

      userIntegration = this.userIntegrationRepository.create({
        user: {id:userId},
        integration: {id:integrationId},
        metadata: {
            accessToken: access_token,
            refreshToken: refresh_token || null,
            expiresIn: expires_in
        },
    });

      return await this.userIntegrationRepository.save(userIntegration);

    } catch (error) {
      Logger.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  }
      
}
