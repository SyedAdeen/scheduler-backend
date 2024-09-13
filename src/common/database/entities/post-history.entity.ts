import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './base.entity';
import { Post } from './post.entity';

@Entity({ name: 'post_history' })
export class PostHistory extends Base {
  @ManyToOne(() => Post, post => post.postHistory, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  details: string; 

  @Column({ type: 'boolean', default: false })
  success: boolean; 
}
