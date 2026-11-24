import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('text')
export class Text {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  content!: string;

  // Поле для обратной совместимости
  @Column({ type: 'text', nullable: true })
  word?: string;

  @Column({ default: 'ru' })
  language!: string;

  @Column({ nullable: true })
  topic?: string;

  @Column({ nullable: true })
  difficulty?: string;

  @Column({ default: 'ai' })
  source!: string; // 'ai' | 'seed' | 'manual'

  @Column({ default: false, nullable: true })
  hasNumbers?: boolean;

  @Column({ default: true, nullable: true })
  hasPunctuation?: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
