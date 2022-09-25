import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { KnownWord } from "./KnownWord";
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
  @OneToOne(() => KnownWord, { nullable: true, eager: true })
  @JoinColumn()
  lastWord!: KnownWord | null;

  // Need to keep track of chain length becoz chainWords does not contain duplicates
  @Column({ default: 0 })
  chainLength!: number;

  // Words that are in the current chain
  @ManyToMany(() => KnownWord)
  @JoinTable({ name: "shiritori_chain" })
  chainWords!: KnownWord[];

  // Words that have ever been used in this channel
  @ManyToMany(() => KnownWord)
  @JoinTable({ name: "shiritori_history" })
  wordHistory!: KnownWord[];
}
