import { Base } from "./base.entity";
import {
    Column,
    Entity,
    OneToMany
} from "typeorm";

import { UserIntegration } from './user-integration.entity'; 
import { Exclude } from "class-transformer";


@Entity({ name: 'integrations' })
export class Integration extends Base {
  @OneToMany(() => UserIntegration, userIntegration => userIntegration.integration)
  userIntegrations: UserIntegration[];

  @Column({ unique: true })
  platform: string; 

  @Column({ type: 'text', nullable: true })
  description: string; 

  @Exclude()
  @Column({ type: 'jsonb', nullable: true })
  metadata: { clientId: string; clientSecret: string, redirectUri: string, oauthUri:string, tokenUri:string, scope:string }; 
}
