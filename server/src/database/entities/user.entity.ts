import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { LeaderBoard } from "./leaderboard.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    avatar?: string;

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Column({ default: 'user' })
    role!: string; // 'user' | 'admin'

    @Column({ default: false })
    isPrivate!: boolean;

    @OneToMany(() => LeaderBoard, (leaderboard) => leaderboard.user)
    leaderboards!: LeaderBoard[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
