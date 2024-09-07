import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Base } from './base.entity';
import { User } from './user.entity';
import { Integration } from './integration.entity';
import { PostMedia } from './post-media.entity';

@Entity({ name: 'posts' })
export class Post extends Base {
  @ManyToOne(() => User, user => user.posts, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Integration, integration => integration.posts, { nullable: false })
  @JoinColumn({ name: 'integration_id' })
  integration: Integration;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'boolean', default: false })
  recurring: boolean;

  @Column({ type: 'varchar', nullable: true })
  scheduled: string | null;

  @OneToMany(() => PostMedia, postMedia => postMedia.post)
  postMedia: PostMedia[];

}
