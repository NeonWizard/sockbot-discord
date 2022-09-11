import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ShiritoriChannel } from "./ShiritoriChannel";

@Entity()
export class ShiritoriInflectionRoot extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ShiritoriChannel, (channel) => channel.inflectionRoots, {
    onDelete: "CASCADE",
  })
  channel!: ShiritoriChannel;

  @Column()
  word!: string;

  @Column({ default: 0 })
  occurrences!: number;
}
