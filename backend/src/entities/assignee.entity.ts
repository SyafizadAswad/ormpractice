import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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

  @OneToMany(() => Issue, (issue) => issue.assignee)
  issues!: Issue[];
}
