// seed-user-integrations.ts
import DataSource from '../ormconfig'; // Import the DataSource instance
import { UserIntegration } from '../entities/user-integration.entity'; // Adjust the path accordingly
import { User } from '../entities/user.entity'; // Import the User entity
import { Integration } from '../entities/integration.entity'; // Import the Integration entity
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module'; // Import AppModule

async function seedUserIntegrations() {
    try {
        // Initialize the DataSource
        const dataSource = await DataSource.initialize();
        
        // Get repositories
        const userIntegrationRepository = dataSource.getRepository(UserIntegration);
        const userRepository = dataSource.getRepository(User);
        const integrationRepository = dataSource.getRepository(Integration);

        // Fetch users and integrations
        const user1 = await userRepository.findOneBy({ id: 11 });
        const user2 = await userRepository.findOneBy({ id: 13 });
        const integration1 = await integrationRepository.findOneBy({ id: 5 });
        const integration2 = await integrationRepository.findOneBy({ id: 6 });

        if (!user1 || !user2 || !integration1 || !integration2) {
            throw new Error('Required data for seeding is missing.');
        }

        // Create instances of UserIntegration with metadata
        const userIntegration1 = new UserIntegration();
        userIntegration1.user = user1;
        userIntegration1.integration = integration1;
        userIntegration1.metadata = {
            accessToken: 'dummyAccessToken1',
            refreshToken: 'dummyRefreshToken1',
        };

        const userIntegration2 = new UserIntegration();
        userIntegration2.user = user1;
        userIntegration2.integration = integration2;
        userIntegration2.metadata = {
            accessToken: 'dummyAccessToken2',
            refreshToken: 'dummyRefreshToken2',
        };

        const userIntegration3 = new UserIntegration();
        userIntegration3.user = user2;
        userIntegration3.integration = integration1;
        userIntegration3.metadata = {
            accessToken: 'dummyAccessToken3',
            refreshToken: 'dummyRefreshToken3',
        };

        const userIntegration4 = new UserIntegration();
        userIntegration4.user = user2;
        userIntegration4.integration = integration2;
        userIntegration4.metadata = {
            accessToken: 'dummyAccessToken4',
            refreshToken: 'dummyRefreshToken4',
        };

        // Save to the database
        await userIntegrationRepository.save([userIntegration1, userIntegration2, userIntegration3, userIntegration4]);

        console.log('Seed data for user_integrations has been successfully inserted.');
    } catch (error) {
        console.error('Error seeding data for user_integrations:', error);
    } finally {
        // Close the DataSource connection
        await DataSource.destroy();
    }
}

seedUserIntegrations();
