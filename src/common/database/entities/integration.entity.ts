import { Base } from "./base.entity";
import {
    Column,
    Entity,
    OneToMany
} from "typeorm";
import { Post } from './post.entity'; // Import Post entity
import { UserIntegration } from './user-integration.entity'; 
import { Exclude } from "class-transformer";
import { IntegrationMetadata } from "../interfaces/integration.metadata.interface";
import { IntegrationPostsTypes } from './integration-posts-types.entity';


@Entity({ name: 'integrations' })
export class Integration extends Base {
  @OneToMany(() => UserIntegration, userIntegration => userIntegration.integration)
  userIntegrations: UserIntegration[];

  @OneToMany(() => IntegrationPostsTypes, integrationPostsTypes => integrationPostsTypes.integration)
  integrationPostsTypes: IntegrationPostsTypes[];

  @OneToMany(() => Post, post => post.integration) // One-to-many relationship with Post
  posts: Post[];

  @Column({ unique: true })
  platform: string; 

  @Column({ type: 'text', nullable: true })
  description: string; 

  @Column()
  icon: string;

  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  metadata: IntegrationMetadata;
}
