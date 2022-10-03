import { BaseEntity, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Lottery } from "./Lottery";
import { ShiritoriChannel } from "./ShiritoriChannel";

@Entity()
export class Guild extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  guildID!: string;

  @OneToMany(() => ShiritoriChannel, (shiritoriChannel) => shiritoriChannel.guild)
  shiritoriChannels!: ShiritoriChannel[];

  @OneToOne(() => Lottery, (lottery) => lottery.guild)
  lottery!: Lottery;
}
