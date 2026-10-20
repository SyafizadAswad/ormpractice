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
const TAGS_PER_ISSUE = 2;
const COMMENTS_PER_ISSUE = 3;

const statuses = ["open", "in_progress", "blocked", "done", "archived"];
const teams = ["platform", "billing", "fulfillment", "support", "growth"];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length]!;
}

async function clearDatabase() {
  await AppDataSource.query(
    `TRUNCATE TABLE issues, issue_comments, items, tags, assignees, manual_create_ones, auto_create_ones RESTART IDENTITY CASCADE`,
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

  console.log(`Seeding ${ISSUE_TARGET} issues (batched)...`);
  const batchSize = 500;
  const allIssueIds: number[] = [];

  for (let offset = 0; offset < ISSUE_TARGET; offset += batchSize) {
    const chunk = Array.from(
      { length: Math.min(batchSize, ISSUE_TARGET - offset) },
      (_, j) => {
        const i = offset + j;
        const created = new Date(Date.now() - (i % 20_000) * 30_000);
        return issueRepo.create({
          title: `Issue ${i + 1} for SKU-${String(i + 1).padStart(6, "0")}`,
          description: `Long description payload for issue ${i + 1}. `.repeat(4),
          status: pick(statuses, i),
          priority: i % 5,
          createdAt: created,
          updatedAt: new Date(created.getTime() + (i % 48) * 3_600_000),
        });
      },
    );

    const saved = await issueRepo.save(chunk);
    allIssueIds.push(...saved.map((s) => s.id));
    console.log(`  ... ${Math.min(offset + batchSize, ISSUE_TARGET)} / ${ISSUE_TARGET}`);
  }

  console.log("Seeding one-to-many related records...");
  for (let offset = 0; offset < allIssueIds.length; offset += batchSize) {
    const issueIds = allIssueIds.slice(offset, offset + batchSize);
    const items = issueIds.map((issueId, index) => {
      const i = offset + index;
      return itemRepo.create({
        issueId,
        sku: `SKU-${String(i + 1).padStart(6, "0")}`,
        name: `Catalog item ${i + 1}`,
        description: `Synthetic catalog description for benchmarking joins (#${i + 1}).`,
      });
    });
    const autoRows = issueIds.map((issueId, index) =>
      autoRepo.create({
        issueId,
        externalRef: `AUTO-${offset + index + 1}`,
        label: `Auto-created snapshot ${offset + index + 1}`,
        metadata: {
          source: "seed",
          revision: (offset + index) % 7,
          flags: ["a", "b", "c"].slice(0, ((offset + index) % 3) + 1),
        },
      }),
    );
    const manualRows = issueIds.map((issueId, index) =>
      manualRepo.create({
        issueId,
        createdBy: `user_${((offset + index) % 50) + 1}`,
        note: `Manual override note for issue batch ${offset + index + 1}`,
        recordedAt: new Date(Date.now() - ((offset + index) % 10_000) * 60_000),
      }),
    );
    const assignees = issueIds.map((issueId, index) =>
      assigneeRepo.create({
        issueId,
        displayName: `Assignee ${offset + index + 1}`,
        email: `assignee${offset + index + 1}@example.com`,
        team: pick(teams, offset + index),
      }),
    );
    const tags = issueIds.flatMap((issueId, index) =>
      Array.from({ length: TAGS_PER_ISSUE }, (_, tagIndex) =>
        tagRepo.create({
          issueId,
          name: `tag-${tagIndex + 1}`,
          color: pick(
            ["#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed"],
            tagIndex,
          ),
        }),
      ),
    );

    await Promise.all([
      itemRepo.save(items),
      autoRepo.save(autoRows),
      manualRepo.save(manualRows),
      assigneeRepo.save(assignees),
      tagRepo.save(tags),
    ]);
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
  const itemCount = await itemRepo.count();
  console.log(`Seed complete: ${issueCount} issues, ${itemCount} items.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
