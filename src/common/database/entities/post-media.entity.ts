import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './base.entity';
import { Post } from './post.entity';

@Entity({ name: 'post_media' })
export class PostMedia extends Base {
  @ManyToOne(() => Post, post => post.postMedia, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'varchar' })
  media_url: string;

}
