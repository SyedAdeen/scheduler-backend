import DataSource from '../ormconfig';
import { PostsTypes } from '../entities/posts-types.entity';

async function seedPostTypes() {
    try {
        // Initialize the DataSource
        const dataSource = await DataSource.initialize();
        console.log(dataSource, "Initialized");

        // Get the repository
        const postTypesRepository = dataSource.getRepository(PostsTypes);

        // Define post types
        const postTypes = [
            { name: 'Text' },
            { name: 'Image' },
            { name: 'Video' },
            { name: 'Poll' },
            { name: 'Media Carousel' },
            { name: 'Document' }
        ];

        // Create PostsTypes instances
        const postTypesEntities = postTypes.map(type => {
            const postType = new PostsTypes();
            postType.name = type.name;
            return postType;
        });

        // Save to the database
        await postTypesRepository.save(postTypesEntities);

        console.log('Post types have been successfully inserted.');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        // Close the DataSource connection
        await DataSource.destroy();
    }
}

seedPostTypes();
