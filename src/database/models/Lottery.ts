import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { LotteryEntry } from "./LotteryEntry";
import { User } from "./User";

@Entity()
export class Lottery extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // todo...
  // OneToOne(() => Guild)
  // guild!: Guild;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  startedAt!: Date;

  // Duration in days
  @Column()
  duration!: number;

  @Column({ default: 30 })
  ticketCost!: number;

  @OneToMany(() => LotteryEntry, (entry) => entry.lottery)
  entries!: LotteryEntry[];

  @OneToOne(() => User, { eager: true, nullable: true })
  @JoinColumn()
  winningUser!: User | null;

  readonly jackpotModifier = 0.85;
}
