// seed-integrations.ts
import DataSource from '../ormconfig';
import { Integration } from '../entities/integration.entity';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { EncryptionService } from '../../utilities/encryption.utlis';

async function seedIntegrations() {
    try {
        // Initialize the DataSource
        const dataSource = await DataSource.initialize();
        console.log(dataSource,"Initialized");
        
        // Get the repository
        const integrationRepository = dataSource.getRepository(Integration);

        // Create a NestJS application context
        const appContext = await NestFactory.createApplicationContext(AppModule);
        const configService = appContext.get(ConfigService);
        const encryptionService = appContext.get(EncryptionService);

        // Fetch credentials from configuration
        const linkedinClientId = configService.get<string>('LINKEDIN_CLIENT_ID');
        const linkedinClientSecret = configService.get<string>('LINKEDIN_CLIENT_SECRET');
        const facebookClientId = configService.get<string>('FACEBOOK_CLIENT_ID');
        const facebookClientSecret = configService.get<string>('FACEBOOK_CLIENT_SECRET');

        // Encrypt the credentials using EncryptionService
        const encryptedLinkedInClientId = encryptionService.encrypt(linkedinClientId || '');
        const encryptedLinkedInClientSecret = encryptionService.encrypt(linkedinClientSecret || '');
        const encryptedFacebookClientId = encryptionService.encrypt(facebookClientId || '');
        const encryptedFacebookClientSecret = encryptionService.encrypt(facebookClientSecret || '');

        // Create Integration instances with metadata
        const linkedinIntegration = new Integration();
        linkedinIntegration.platform = 'LinkedIn';
        linkedinIntegration.description = 'This is LinkedIn Integration';
        linkedinIntegration.icon="linkedin";
        linkedinIntegration.metadata = {
            clientId: encryptedLinkedInClientId,
            clientSecret: encryptedLinkedInClientSecret,
            redirectUri:"/integrations/callback",
            oauthUri:"https://www.linkedin.com/oauth/v2/authorization",
            tokenUri: "https://www.linkedin.com/oauth/v2/accessToken",
            scope: 'openid profile email w_member_social',
        }; 

        const facebookIntegration = new Integration();
        facebookIntegration.platform = 'Facebook';
        facebookIntegration.description = 'This is the Facebook Integration';
        facebookIntegration.icon="facebook";
        facebookIntegration.metadata = {
            clientId: encryptedFacebookClientId,
            clientSecret: encryptedFacebookClientSecret,
            redirectUri:"/integrations/callback",
            oauthUri:"https://www.facebook.com/v10.0/dialog/oauth",
            tokenUri: "https://graph.facebook.com/oauth/access_token",
            scope: "public_profile email pages_manage_posts pages_read_engagement publish_to_groups"
        };

        // Save to the database
        await integrationRepository.save([linkedinIntegration, facebookIntegration]);

        console.log('Seed data has been successfully inserted.');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        // Close the DataSource connection
        await DataSource.destroy();
    }
}

seedIntegrations();
