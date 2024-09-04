import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './base.entity';
import { Integration } from './integration.entity';
import { PostsTypes } from './posts-types.entity';

@Entity({ name: 'integration_posts_types' })
export class IntegrationPostsTypes extends Base {

  @ManyToOne(() => Integration, integration => integration.integrationPostsTypes)
  @JoinColumn({ name: 'integration_id' })
  integration: Integration;

  @ManyToOne(() => PostsTypes, postsTypes => postsTypes.integrationPostsTypes)
  @JoinColumn({ name: 'post_type_id' })
  postType: PostsTypes;
}
