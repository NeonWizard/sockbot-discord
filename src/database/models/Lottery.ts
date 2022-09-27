import { BaseEntity, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Guild } from "./Guild";
import { LotteryTicket } from "./LotteryTicket";

@Entity()
export class Lottery extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Guild, (guild) => guild.lottery)
  guild!: Guild;

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
