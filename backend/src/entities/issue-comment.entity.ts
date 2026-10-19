import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Issue } from "./issue.entity";

@Entity("issue_comments")
export class IssueComment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "issue_id", type: "int" })
  issueId!: number;

  @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "issue_id" })
  issue!: Issue;

  @Column({ type: "varchar", length: 120 })
  author!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "timestamptz" })
  createdAt!: Date;
}
