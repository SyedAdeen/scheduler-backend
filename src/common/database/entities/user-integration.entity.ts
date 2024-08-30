// user-integration.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, DeleteDateColumn, } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Base } from './base.entity'; 
import { User } from './user.entity'; 
import { Integration } from './integration.entity'; 
 

@Entity({ name: 'user_integrations' })
export class UserIntegration extends Base {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User; // Reference to the User entity

  @ManyToOne(() => Integration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integration_id' })
  integration: Integration; // Reference to the Integration entity

  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  metadata: { accessToken: string; refreshToken: string, expiresIn: string }; // Metadata as JSON containing access token and refresh token

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamp' })
  deletedAt: Date; // Timestamp for soft deletion
}
