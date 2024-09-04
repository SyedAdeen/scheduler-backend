// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { IntegrationPostsTypes } from '../../common/database/entities/integration-posts-types.entity';

// @Injectable()
// export class PostsService {
//   constructor(
//     @InjectRepository(IntegrationPostsTypes)
//     private readonly integrationPostsTypesRepository: Repository<IntegrationPostsTypes>
//   ) {}

//   async getPostTypesForIntegration(integrationId: string): Promise<IntegrationPostsTypes[]> {
//     // Convert integrationId to number
//     const integrationIdNumber = parseInt(integrationId, 10);

//     if (isNaN(integrationIdNumber)) {
//       throw new NotFoundException(`Invalid integration ID ${integrationId}`);
//     }

//     const postTypes = await this.integrationPostsTypesRepository.find({
//       where: { integration: { id: integrationIdNumber } },
//       relations: ['postType'] // Assuming you want to get related post types
//     });

//     if (!postTypes.length) {
//       throw new NotFoundException(`No post types found for integration ID ${integrationId}`);
//     }

//     return postTypes;
//   }
// }



import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationPostsTypes } from '../../common/database/entities/integration-posts-types.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(IntegrationPostsTypes)
    private readonly integrationPostsTypesRepository: Repository<IntegrationPostsTypes>
  ) {}

  async getPostTypesForIntegration(integrationId: string): Promise<{ id: number, name: string }[]> {
    // Convert integrationId to number
    const integrationIdNumber = parseInt(integrationId, 10);

    if (isNaN(integrationIdNumber)) {
      throw new NotFoundException(`Invalid integration ID ${integrationId}`);
    }

    const postTypes = await this.integrationPostsTypesRepository.find({
      where: { integration: { id: integrationIdNumber } },
      relations: ['postType'] // Fetch related post types
    });

    if (!postTypes.length) {
      throw new NotFoundException(`No post types found for integration ID ${integrationId}`);
    }

    // Map the results to return only the postType id and name
    return postTypes.map(pt => ({
      id: pt.postType.id,
      name: pt.postType.name
    }));
  }
}

