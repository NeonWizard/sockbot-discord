import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { LotteryTicket } from "./LotteryTicket";

@Entity()
export class Lottery extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // todo...
  // OneToOne(() => Guild)
  // guild!: Guild;

  @Column()
  channelID!: string;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  startedAt!: Date;

  @OneToMany(() => LotteryTicket, (ticket) => ticket.lottery)
  tickets!: LotteryTicket[];

  @Column("int", { array: true })
  winningNumbers!: number[];
}
