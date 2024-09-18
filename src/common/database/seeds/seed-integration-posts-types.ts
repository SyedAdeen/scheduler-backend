import DataSource from '../ormconfig';
import { Integration } from '../entities/integration.entity';
import { PostType } from '../entities/post-type.entity';
import { IntegrationPostsTypes } from '../entities/integration-posts-types.entity';
import { In } from 'typeorm';

async function seedIntegrationPostTypes() {
    try {
        // Initialize the DataSource
        const dataSource = await DataSource.initialize();
        console.log(dataSource, "Initialized");

        // Get repositories
        const integrationRepository = dataSource.getRepository(Integration);
        const postTypesRepository = dataSource.getRepository(PostType);
        const integrationPostTypesRepository = dataSource.getRepository(IntegrationPostsTypes);

        // Find integration entities for LinkedIn and Facebook
        const linkedinIntegration = await integrationRepository.findOneBy({ platform: 'LinkedIn' });
        const facebookIntegration = await integrationRepository.findOneBy({ platform: 'Facebook' });

        if (!linkedinIntegration || !facebookIntegration) {
            throw new Error('One or both integrations not found.');
        }

        // Find post type entities
        const postTypes = await postTypesRepository.findBy({
            name: In(['Text', 'Image', 'Video', 'Poll', 'Document', 'Media Carousel'])
        });

        if (postTypes.length < 5) {
            throw new Error('Not all post types found.');
        }

        const textPostType = postTypes.find(pt => pt.name === 'Text');
        const imagePostType = postTypes.find(pt => pt.name === 'Image');
        const videoPostType = postTypes.find(pt => pt.name === 'Video');
        const pollPostType = postTypes.find(pt => pt.name === 'Poll');
        const documentPostType = postTypes.find(pt => pt.name === 'Document');
        const mediaCarouselPostType = postTypes.find(pt => pt.name === 'Media Carousel');

        if (!textPostType || !imagePostType || !videoPostType || !pollPostType || !documentPostType || !mediaCarouselPostType) {
            throw new Error('One or more post types not found.');
        }

        // Create IntegrationPostsTypes instances
        const integrationPostTypesData = [
            // LinkedIn post types
            { integration: linkedinIntegration, postType: textPostType },
            { integration: linkedinIntegration, postType: imagePostType },
            { integration: linkedinIntegration, postType: videoPostType },
            { integration: linkedinIntegration, postType: pollPostType },

            // Facebook post types
            { integration: facebookIntegration, postType: textPostType },
            { integration: facebookIntegration, postType: imagePostType },
            { integration: facebookIntegration, postType: videoPostType },

        ];

        // Create IntegrationPostsTypes instances
        const integrationPostTypesEntities = integrationPostTypesData.map(data => {
            const integrationPostType = new IntegrationPostsTypes();
            integrationPostType.integration = data.integration;
            integrationPostType.postType = data.postType;
            return integrationPostType;
        });

        // Save to the database
        await integrationPostTypesRepository.save(integrationPostTypesEntities);

        console.log('Integration post types have been successfully inserted.');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        // Close the DataSource connection
        await DataSource.destroy();
    }
}

seedIntegrationPostTypes();
