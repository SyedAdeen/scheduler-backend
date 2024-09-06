import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './base.entity';
import { Integration } from './integration.entity';
import { PostType } from './post-type.entity';

@Entity({ name: 'integration_posts_types' })
export class IntegrationPostsTypes extends Base {

  @ManyToOne(() => Integration, integration => integration.integrationPostsTypes)
  @JoinColumn({ name: 'integration_id' })
  integration: Integration;

  @ManyToOne(() => PostType, postsTypes => postsTypes.integrationPostsTypes)
  @JoinColumn({ name: 'post_type_id' })
  postType: PostType;
}
