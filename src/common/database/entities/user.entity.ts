import { Base } from "./base.entity";
import {
    Column,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
} from "typeorm";
import { Exclude, Transform } from "class-transformer";

export enum UserStatus {
    Blocked = -1,
    Active,
}

export enum UserRole {
    User,
    Agent,
    Admin,
    SuperAdmin,
}

export enum UserType {
    User = "user",
    Agent = "agent",
}

@Entity({ name: "users" })
export class User extends Base {
    @Column({ unique: true })
    email?: string;

    @Exclude()
    @Column()
    password: string;

    @Column()
    name: string;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ default: UserStatus.Active })
    status: UserStatus;

    @DeleteDateColumn({ name: "deleted_at", nullable: true, type: "timestamp" })
    deletedAt: Date;

    @Column({ nullable: true })
    role: UserRole;

    accessToken: string;
}
