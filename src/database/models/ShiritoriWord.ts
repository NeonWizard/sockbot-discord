import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { KnownWord } from "./KnownWord";
import { ShiritoriChannel } from "./ShiritoriChannel";

// Linking table between ShiritoriChannel and KnownWord
@Entity()
export class ShiritoriWord extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ShiritoriChannel, (channel) => channel.shiritoriWords, {
    onDelete: "CASCADE",
    eager: true,
    nullable: false,
  })
  channel!: ShiritoriChannel;

  @ManyToOne(() => KnownWord, {
    onDelete: "CASCADE",
    eager: true,
    nullable: false,
  })
  word!: KnownWord;

  // Whether the word is in the current chain for the channel
  @Column()
  chained!: boolean;
}
