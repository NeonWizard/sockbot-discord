import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Lottery } from "./Lottery";
import { User } from "./User";

@Entity()
export class LotteryEntry extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Lottery, { eager: true, onDelete: "CASCADE" })
  lottery!: Lottery;

  @OneToOne(() => User, { eager: true, onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @Column()
  tickets!: number;
}
