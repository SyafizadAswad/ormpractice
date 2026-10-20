import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
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

  @Column({ name: "issue_id", type: "int", nullable: true })
  issueId!: number | null;

  @ManyToOne(() => Issue, (issue) => issue.manualCreateOnes, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "issue_id" })
  issue!: Issue;
}
