import { BaseEntity, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class KnownWord extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  text!: string;

  @Column({ default: 0 })
  occurrences!: number;

  // Whether word is valid according to dictionary API. Null if unknown
  @Column({ type: "boolean", nullable: true })
  valid!: boolean | null;

  @ManyToMany(() => KnownWord, (word) => word.inflections, { onDelete: "CASCADE" })
  inflectionOf!: KnownWord[];

  @ManyToMany(() => KnownWord, (word) => word.inflectionOf, { onDelete: "CASCADE" })
  @JoinTable({
    name: "known_word_inflections",
    joinColumn: {
      name: "inflectionOf",
    },
    inverseJoinColumn: {
      name: "inflection",
    },
  })
  inflections!: KnownWord[];
}
