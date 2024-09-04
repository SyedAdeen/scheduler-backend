import { Entity, Column, DeleteDateColumn, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { IntegrationPostsTypes } from './integration-posts-types.entity';

@Entity({ name: 'posts_types' })
export class PostsTypes extends Base {

  @Column({ type: 'varchar', unique: true })
  name: string;  // Name of the post type, e.g., 'Text', 'Image', 'Video'

  @OneToMany(() => IntegrationPostsTypes, integrationPostsTypes => integrationPostsTypes.postType)
  integrationPostsTypes: IntegrationPostsTypes[];

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamp' })
  deletedAt: Date; // Timestamp for soft deletion
}
