import  DataSource  from '../ormconfig'; 
import { User, UserType } from '../entities/user.entity'; 
import { Integration } from '../entities/integration.entity'; 
import { UserIntegration } from '../entities/user-integration.entity'; 

async function seedUserIntegrations() {
    try {
        // Initialize the DataSource
        const dataSource = await DataSource.initialize();
        
        // Get repositories
        const userIntegrationRepository = dataSource.getRepository(UserIntegration);
        const userRepository = dataSource.getRepository(User);
        const integrationRepository = dataSource.getRepository(Integration);

        // Create and save users
        const user1 = await userRepository.save(userRepository.create({
            name: 'User 1',
            email: 'user1@example.com',
            password: 'hashedPassword1', // Use a hashed password
            type: UserType.User,
            verified: true,
        }));
        
        const user2 = await userRepository.save(userRepository.create({
            name: 'User 2',
            email: 'user2@example.com',
            password: 'hashedPassword2', // Use a hashed password
            type: UserType.User,
            verified: true,
        }));

        // Find or create integrations
        const integration1 = await integrationRepository.findOneBy({ platform: 'LinkedIn' }) || await integrationRepository.save(integrationRepository.create({
            platform: 'LinkedIn',
            description: 'Integration with LinkedIn',
        }));
        
        const integration2 = await integrationRepository.findOneBy({ platform: 'Facebook' }) || await integrationRepository.save(integrationRepository.create({
            platform: 'Facebook',
            description: 'Integration with Facebook',
        }));

        // Create instances of UserIntegration with metadata
        const userIntegration1 = userIntegrationRepository.create({
            user: user1,
            integration: integration1,
            metadata: {
                accessToken: 'dummyAccessToken1',
                refreshToken: 'dummyRefreshToken1',
            },
        });

        const userIntegration2 = userIntegrationRepository.create({
            user: user1,
            integration: integration2,
            metadata: {
                accessToken: 'dummyAccessToken2',
                refreshToken: 'dummyRefreshToken2',
            },
        });

        const userIntegration3 = userIntegrationRepository.create({
            user: user2,
            integration: integration1,
            metadata: {
                accessToken: 'dummyAccessToken3',
                refreshToken: 'dummyRefreshToken3',
            },
        });

        const userIntegration4 = userIntegrationRepository.create({
            user: user2,
            integration: integration2,
            metadata: {
                accessToken: 'dummyAccessToken4',
                refreshToken: 'dummyRefreshToken4',
            },
        });

        // Save UserIntegration entries
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
