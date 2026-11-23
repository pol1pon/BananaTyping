import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('leaderboard')
export class LeaderBoard {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.leaderboards)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: number;

    @Column({ type: 'int' })
    wpm!: number;

    @Column({ type: 'int' })
    accuracy!: number;

    @Column({ type: 'int' })
    duration_sec!: number;

    @CreateDateColumn()
    createdAt!: Date;
}