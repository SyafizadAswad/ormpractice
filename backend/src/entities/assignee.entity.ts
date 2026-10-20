import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Issue } from "./issue.entity";

@Entity("assignees")
export class Assignee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120 })
  displayName!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 64 })
  team!: string;

  @Column({ name: "issue_id", type: "int", nullable: true })
  issueId!: number | null;

  @ManyToOne(() => Issue, (issue) => issue.assignees, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "issue_id" })
  issue!: Issue;
}
