import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

  @ManyToOne(() => KnownWord, (word) => word.inflections, { nullable: true })
  inflectionRoot!: KnownWord | null;

  @OneToMany(() => KnownWord, (word) => word.inflectionRoot)
  inflections!: KnownWord[];
}
