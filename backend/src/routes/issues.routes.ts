import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Issue } from "../entities/issue.entity";
import { IssueService } from "../services/issue.service";
import { Item } from "../entities/item.entity";
import { IssueComment } from "../entities/issue-comment.entity";

const router = Router();
const issueService = new IssueService(AppDataSource.getRepository(Issue));

router.get("/meta/items", async (_req: Request, res: Response) => {
  const items = await AppDataSource.getRepository(Item).find({
    select: ["id", "sku", "name"],
    order: { id: "ASC" },
    take: 500,
  });
  res.json({ items });
});

router.get("/", async (req: Request, res: Response) => {
  const raw = req.query.itemIds;
  if (!raw || typeof raw !== "string") {
    res.status(400).json({
      error: "Query parameter itemIds is required (comma-separated item ids).",
    });
    return;
  }

  const itemIds = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (itemIds.length === 0) {
    res.status(400).json({ error: "No valid itemIds provided." });
    return;
  }

  const started = performance.now();
  const data = await issueService.findHeavyByItemIds(itemIds);
  const serverMs = Math.round(performance.now() - started);

  res.json({
    meta: {
      itemIdCount: itemIds.length,
      issueCount: data.length,
      serverMs,
    },
    data,
  });
});

export default router;
