import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Item } from "./item.entity";
import { AutoCreateOne } from "./auto-create-one.entity";
import { ManualCreateOne } from "./manual-create-one.entity";
import { Assignee } from "./assignee.entity";
import { IssueComment } from "./issue-comment.entity";
import { Tag } from "./tag.entity";

@Entity("issues")
export class Issue {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Item, (item) => item.issue)
  items!: Item[];

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 32 })
  status!: string;

  @Column({ type: "int", default: 0 })
  priority!: number;

  @OneToMany(() => AutoCreateOne, (row) => row.issue)
  autoCreateOnes!: AutoCreateOne[];

  @OneToMany(() => ManualCreateOne, (row) => row.issue)
  manualCreateOnes!: ManualCreateOne[];

  @OneToMany(() => Assignee, (assignee) => assignee.issue)
  assignees!: Assignee[];

  @OneToMany(() => IssueComment, (comment) => comment.issue)
  comments!: IssueComment[];

  @OneToMany(() => Tag, (tag) => tag.issue)
  tags!: Tag[];

  @Column({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz" })
  updatedAt!: Date;
}
