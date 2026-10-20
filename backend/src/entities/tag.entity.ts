import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Issue } from "./issue.entity";

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Column({ type: "varchar", length: 32 })
  color!: string;

  @Column({ name: "issue_id", type: "int", nullable: true })
  issueId!: number | null;

  @ManyToOne(() => Issue, (issue) => issue.tags, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "issue_id" })
  issue!: Issue;
}
