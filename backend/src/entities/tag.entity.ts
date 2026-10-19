import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Issue } from "./issue.entity";

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 80, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 32 })
  color!: string;

  @ManyToMany(() => Issue, (issue) => issue.tags)
  issues!: Issue[];
}
