import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { KnownWord } from "./KnownWord";
import { ShiritoriWord } from "./ShiritoriWord";
import { User } from "./User";

@Entity()
export class ShiritoriChannel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  channelID!: string;

  @ManyToOne(() => User, { eager: true })
  lastUser!: User | null;

  @OneToOne(() => KnownWord, { nullable: true, eager: true })
  @JoinColumn()
  lastWord!: KnownWord | null;

  // Need to keep track of length becoz words are not duplicated in database
  @Column({ default: 0 })
  chainLength!: number;

  // Words that have ever been used in this channel
  @OneToMany(() => ShiritoriWord, (shiritoriWord) => shiritoriWord.channel)
  shiritoriWords!: ShiritoriWord[];
}
