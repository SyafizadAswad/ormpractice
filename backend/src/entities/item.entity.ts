import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Issue } from "./issue.entity";

@Entity("items")
export class Item {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120 })
  sku!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "issue_id", type: "int", nullable: true })
  issueId!: number | null;

  @ManyToOne(() => Issue, (issue) => issue.items, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "issue_id" })
  issue!: Issue;
}
