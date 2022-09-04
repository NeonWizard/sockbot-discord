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

  // Need to keep track of last word becoz chainWords is unordered
  @OneToOne(() => ShiritoriWord, { nullable: true, eager: true })
  @JoinColumn()
  lastWord!: ShiritoriWord | null;

  // Need to keep track of chain length becoz chainWords does not contain duplicates
  @Column({ default: 0 })
  chainLength!: number;

  // Words that are in the current chain
  @OneToMany(() => ShiritoriWord, (word) => word.chainChannel, { eager: true })
  chainWords!: ShiritoriWord[];

  // Words that have ever been used in this channel
  @OneToMany(() => ShiritoriWord, (word) => word.channel, { eager: true })
  wordHistory!: ShiritoriWord[];
}
