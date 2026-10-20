import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Issue } from "./issue.entity";

@Entity("auto_create_ones")
export class AutoCreateOne {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64 })
  externalRef!: string;

  @Column({ type: "varchar", length: 255 })
  label!: string;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @Column({ name: "issue_id", type: "int", nullable: true })
  issueId!: number | null;

  @ManyToOne(() => Issue, (issue) => issue.autoCreateOnes, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "issue_id" })
  issue!: Issue;
}
