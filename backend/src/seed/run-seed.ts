import "reflect-metadata";
import { config } from "dotenv";

config();
import { AppDataSource } from "../data-source";
import { Item } from "../entities/item.entity";
import { AutoCreateOne } from "../entities/auto-create-one.entity";
import { ManualCreateOne } from "../entities/manual-create-one.entity";
import { Assignee } from "../entities/assignee.entity";
import { Tag } from "../entities/tag.entity";
import { Issue } from "../entities/issue.entity";
import { IssueComment } from "../entities/issue-comment.entity";

const ISSUE_TARGET = 5000;
const ITEM_COUNT = 400;
const TAG_COUNT = 40;
const ASSIGNEE_COUNT = 80;
const COMMENTS_PER_ISSUE = 3;

const statuses = ["open", "in_progress", "blocked", "done", "archived"];
const teams = ["platform", "billing", "fulfillment", "support", "growth"];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length]!;
}

async function clearDatabase() {
  await AppDataSource.query(`TRUNCATE TABLE issue_tags RESTART IDENTITY CASCADE`);
  await AppDataSource.query(
    `TRUNCATE TABLE issue_comments, issues, tags, assignees, manual_create_ones, auto_create_ones, items RESTART IDENTITY CASCADE`,
  );
}

async function seed() {
  console.log("Connecting to database...");
  await AppDataSource.initialize();

  console.log("Clearing existing data...");
  await clearDatabase();

  const itemRepo = AppDataSource.getRepository(Item);
  const autoRepo = AppDataSource.getRepository(AutoCreateOne);
  const manualRepo = AppDataSource.getRepository(ManualCreateOne);
  const assigneeRepo = AppDataSource.getRepository(Assignee);
  const tagRepo = AppDataSource.getRepository(Tag);
  const issueRepo = AppDataSource.getRepository(Issue);
  const commentRepo = AppDataSource.getRepository(IssueComment);

  console.log(`Seeding ${ITEM_COUNT} items...`);
  const items = await itemRepo.save(
    Array.from({ length: ITEM_COUNT }, (_, i) =>
      itemRepo.create({
        sku: `SKU-${String(i + 1).padStart(6, "0")}`,
        name: `Catalog item ${i + 1}`,
        description: `Synthetic catalog description for benchmarking joins (#${i + 1}).`,
      }),
    ),
  );

  console.log("Seeding relation lookup tables...");
  const autoRows = await autoRepo.save(
    Array.from({ length: ISSUE_TARGET }, (_, i) =>
      autoRepo.create({
        externalRef: `AUTO-${i + 1}`,
        label: `Auto-created snapshot ${i + 1}`,
        metadata: {
          source: "seed",
          revision: i % 7,
          flags: ["a", "b", "c"].slice(0, (i % 3) + 1),
        },
      }),
    ),
  );

  const manualRows = await manualRepo.save(
    Array.from({ length: ISSUE_TARGET }, (_, i) =>
      manualRepo.create({
        createdBy: `user_${(i % 50) + 1}`,
        note: `Manual override note for issue batch ${i + 1}`,
        recordedAt: new Date(Date.now() - (i % 10_000) * 60_000),
      }),
    ),
  );

  const assignees = await assigneeRepo.save(
    Array.from({ length: ASSIGNEE_COUNT }, (_, i) =>
      assigneeRepo.create({
        displayName: `Assignee ${i + 1}`,
        email: `assignee${i + 1}@example.com`,
        team: pick(teams, i),
      }),
    ),
  );

  const tags = await tagRepo.save(
    Array.from({ length: TAG_COUNT }, (_, i) =>
      tagRepo.create({
        name: `tag-${i + 1}`,
        color: pick(
          ["#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed"],
          i,
        ),
      }),
    ),
  );

  console.log(`Seeding ${ISSUE_TARGET} issues (batched)...`);
  const batchSize = 500;
  const allIssueIds: number[] = [];

  for (let offset = 0; offset < ISSUE_TARGET; offset += batchSize) {
    const chunk = Array.from(
      { length: Math.min(batchSize, ISSUE_TARGET - offset) },
      (_, j) => {
        const i = offset + j;
        const item = items[i % items.length]!;
        const created = new Date(Date.now() - (i % 20_000) * 30_000);
        return issueRepo.create({
          itemId: item.id,
          item,
          title: `Issue ${i + 1} for ${item.sku}`,
          description: `Long description payload for issue ${i + 1}. `.repeat(4),
          status: pick(statuses, i),
          priority: i % 5,
          autoCreateOneId: autoRows[i]!.id,
          autoCreateOne: autoRows[i]!,
          manualCreateOneId: manualRows[i]!.id,
          manualCreateOne: manualRows[i]!,
          assigneeId: assignees[i % assignees.length]!.id,
          assignee: assignees[i % assignees.length]!,
          tags: [tags[i % tags.length]!, tags[(i + 3) % tags.length]!],
          createdAt: created,
          updatedAt: new Date(created.getTime() + (i % 48) * 3_600_000),
        });
      },
    );

    const saved = await issueRepo.save(chunk);
    allIssueIds.push(...saved.map((s) => s.id));
    console.log(`  ... ${Math.min(offset + batchSize, ISSUE_TARGET)} / ${ISSUE_TARGET}`);
  }

  console.log("Seeding issue comments...");
  const commentBatch: IssueComment[] = [];
  for (let idx = 0; idx < allIssueIds.length; idx++) {
    const issueId = allIssueIds[idx]!;
    for (let c = 0; c < COMMENTS_PER_ISSUE; c++) {
      commentBatch.push(
        commentRepo.create({
          issueId,
          author: `commenter_${(idx + c) % 30}`,
          body: `Comment ${c + 1} on issue ${issueId}. `.repeat(2),
          createdAt: new Date(Date.now() - (idx + c) * 120_000),
        }),
      );
    }
    if (commentBatch.length >= 1500) {
      await commentRepo.save(commentBatch.splice(0, commentBatch.length));
    }
  }
  if (commentBatch.length > 0) {
    await commentRepo.save(commentBatch);
  }

  const issueCount = await issueRepo.count();
  console.log(`Seed complete: ${issueCount} issues, ${items.length} items.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
