import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

export enum ActionType {
  PAY = "pay",
  DOUBLEORNOTHING_WIN = "doubleornothing_win",
  DOUBLEORNOTHING_LOSS = "doubleornothing_loss",
  SHIRITORI = "shiritori",
  SHIRITORI_FAIL = "shiritori_fail",
}

@Entity()
export class UserHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt!: Date;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  user!: User;

  @Column({ type: "enum", enum: ActionType })
  action!: ActionType;

  @ManyToOne(() => User, { eager: true, nullable: true })
  targetUser!: User | null;

  @Column({ nullable: true })
  value1!: number;

  @Column({ nullable: true })
  value2!: number;
}
