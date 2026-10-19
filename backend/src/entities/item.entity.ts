import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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

  @OneToMany(() => Issue, (issue) => issue.item)
  issues!: Issue[];
}
