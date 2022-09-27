import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Lottery } from "./Lottery";
import { ShiritoriChannel } from "./ShiritoriChannel";

@Entity()
export class Guild extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  guildID!: string;

  @OneToOne(() => ShiritoriChannel)
  @JoinColumn()
  shiritoriChannel!: ShiritoriChannel;

  @OneToOne(() => Lottery)
  @JoinColumn()
  lottery!: Lottery;
}
