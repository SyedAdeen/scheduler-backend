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
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column({ default: false })
    verified: boolean;

    @Column({ type: "integer", nullable: true })
    type: number;

    @Column({ nullable: true })
    googleid: string;

    @DeleteDateColumn({ name: "deleted_at", nullable: true, type: "timestamp" })
    deletedAt: Date;


}
