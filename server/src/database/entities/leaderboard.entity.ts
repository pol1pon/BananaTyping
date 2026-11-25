import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('leaderboard')
export class LeaderBoard {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.leaderboards, { onDelete: 'CASCADE' })
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

    @Column({ type: 'varchar', length: 10, nullable: true })
    language?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    mode?: string;

    @Column({ type: 'int', nullable: true })
    characters?: number;

    @Column({ type: 'int', nullable: true })
    errors?: number;

    @CreateDateColumn()
    createdAt!: Date;
}