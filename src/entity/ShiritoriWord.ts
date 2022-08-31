import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ShiritoriChannel } from "./ShiritoriChannel";

@Entity()
export class ShiritoriWord extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ShiritoriChannel, (channel) => channel.chainWords, {
    onDelete: "CASCADE",
  })
  chainChannel!: ShiritoriChannel;

  @ManyToOne(() => ShiritoriChannel, (channel) => channel.wordHistory, {
    onDelete: "CASCADE",
  })
  channel!: ShiritoriChannel;

  @Column()
  word!: string;

  @Column({ default: 0 })
  occurrences!: number;

  // TODO: Time shouldn't matter, what matters is how far back in the chain
  // @Column({ type: "timestamptz" })
  // lastOccurrence!: Date;
}
