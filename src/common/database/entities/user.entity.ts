import { Base } from "./base.entity";
import {
    Column,
    DeleteDateColumn,
    Entity,
    OneToMany,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Post } from './post.entity'; // Import Post entity

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
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column()
    name: string;

    @Column({ default: false })
    verified: boolean;

    @Column({
        type: "enum",
        enum: UserType,
        nullable: true,
    })
    type: UserType;

    @Column({ nullable: true })
    googleid: string;

    @OneToMany(() => Post, post => post.user) // One-to-many relationship with Post
    posts: Post[];

    @DeleteDateColumn({ name: "deleted_at", nullable: true, type: "timestamp" })
    deletedAt: Date;
}
