import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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

  @OneToMany(() => Issue, (issue) => issue.autoCreateOne)
  issues!: Issue[];
}
