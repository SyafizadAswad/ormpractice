import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
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

  @Column({ name: "item_id", type: "int" })
  itemId!: number;

  @ManyToOne(() => Item, (item) => item.issues, { nullable: false })
  @JoinColumn({ name: "item_id" })
  item!: Item;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 32 })
  status!: string;

  @Column({ type: "int", default: 0 })
  priority!: number;

  @Column({ name: "auto_create_one_id", type: "int", nullable: true })
  autoCreateOneId!: number | null;

  @ManyToOne(() => AutoCreateOne, (row) => row.issues, { nullable: true })
  @JoinColumn({ name: "auto_create_one_id" })
  autoCreateOne!: AutoCreateOne | null;

  @Column({ name: "manual_create_one_id", type: "int", nullable: true })
  manualCreateOneId!: number | null;

  @ManyToOne(() => ManualCreateOne, (row) => row.issues, { nullable: true })
  @JoinColumn({ name: "manual_create_one_id" })
  manualCreateOne!: ManualCreateOne | null;

  @Column({ name: "assignee_id", type: "int", nullable: true })
  assigneeId!: number | null;

  @ManyToOne(() => Assignee, (assignee) => assignee.issues, { nullable: true })
  @JoinColumn({ name: "assignee_id" })
  assignee!: Assignee | null;

  @OneToMany(() => IssueComment, (comment) => comment.issue)
  comments!: IssueComment[];

  @ManyToMany(() => Tag, (tag) => tag.issues, { cascade: false })
  @JoinTable({
    name: "issue_tags",
    joinColumn: { name: "issue_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags!: Tag[];

  @Column({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz" })
  updatedAt!: Date;
}
