import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Issue } from "./issue.entity";

@Entity("manual_create_ones")
export class ManualCreateOne {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64 })
  createdBy!: string;

  @Column({ type: "varchar", length: 255 })
  note!: string;

  @Column({ type: "timestamptz" })
  recordedAt!: Date;

  @OneToMany(() => Issue, (issue) => issue.manualCreateOne)
  issues!: Issue[];
}
