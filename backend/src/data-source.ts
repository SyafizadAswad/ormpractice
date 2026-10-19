import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import { Item } from "./entities/item.entity";
import { Issue } from "./entities/issue.entity";
import { AutoCreateOne } from "./entities/auto-create-one.entity";
import { ManualCreateOne } from "./entities/manual-create-one.entity";
import { Assignee } from "./entities/assignee.entity";
import { IssueComment } from "./entities/issue-comment.entity";
import { Tag } from "./entities/tag.entity";

config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? "orm_user",
  password: process.env.DB_PASSWORD ?? "orm_password",
  database: process.env.DB_DATABASE ?? "orm_practice",
  synchronize: true,
  logging:
    process.env.TYPEORM_LOGGING === "true" ? ["query", "error"] : ["error"],
  maxQueryExecutionTime:
    process.env.TYPEORM_LOGGING === "true" ? 10 : undefined,
  entities: [
    Item,
    Issue,
    AutoCreateOne,
    ManualCreateOne,
    Assignee,
    IssueComment,
    Tag,
  ],
});
