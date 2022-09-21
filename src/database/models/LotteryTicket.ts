import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Lottery } from "./Lottery";
import { User } from "./User";

@Entity()
export class LotteryTicket extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @ManyToOne(() => Lottery, { eager: true, onDelete: "CASCADE" })
  lottery!: Lottery;

  @Index()
  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  user!: User;

  @Column("simple-array")
  numbers!: number[];
}
