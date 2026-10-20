import { In, Repository } from "typeorm";
import { IssueDomain } from "../domain/issue.domain";
import { Assignee } from "../entities/assignee.entity";
import { AutoCreateOne } from "../entities/auto-create-one.entity";
import { IssueComment } from "../entities/issue-comment.entity";
import { Issue } from "../entities/issue.entity";
import { Item } from "../entities/item.entity";
import { ManualCreateOne } from "../entities/manual-create-one.entity";
import { Tag } from "../entities/tag.entity";

export class IssueService {
  constructor(
    private readonly issueRepository: Repository<Issue>,
    private readonly itemRepository: Repository<Item>,
    private readonly autoCreateOneRepository: Repository<AutoCreateOne>,
    private readonly manualCreateOneRepository: Repository<ManualCreateOne>,
    private readonly assigneeRepository: Repository<Assignee>,
    private readonly commentRepository: Repository<IssueComment>,
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findHeavyByItemIds(itemIds: number[]): Promise<IssueDomain[]> {
    const matchingItems = await this.itemRepository.find({
      select: ["id", "issueId"],
      where: { id: In(itemIds) },
    });
    const issueIds = [
      ...new Set(
        matchingItems.flatMap((item) =>
          item.issueId === null ? [] : [item.issueId],
        ),
      ),
    ];
    if (issueIds.length === 0) {
      return [];
    }

    const issues = await this.issueRepository.find({
      where: { id: In(issueIds) },
    });
    const [items, autoCreateOnes, manualCreateOnes, assignees, comments, tags] =
      await Promise.all([
        this.itemRepository.find({ where: { issueId: In(issueIds) } }),
        this.autoCreateOneRepository.find({ where: { issueId: In(issueIds) } }),
        this.manualCreateOneRepository.find({
          where: { issueId: In(issueIds) },
        }),
        this.assigneeRepository.find({ where: { issueId: In(issueIds) } }),
        this.commentRepository.find({ where: { issueId: In(issueIds) } }),
        this.tagRepository.find({ where: { issueId: In(issueIds) } }),
      ]);

    const itemsByIssueId = new Map<number, Item[]>();
    for (const item of items) {
      if (item.issueId === null) {
        continue;
      }
      const issueItems = itemsByIssueId.get(item.issueId) ?? [];
      issueItems.push(item);
      itemsByIssueId.set(item.issueId, issueItems);
    }

    const autoCreateOnesByIssueId = new Map<number, AutoCreateOne[]>();
    for (const row of autoCreateOnes) {
      if (row.issueId === null) {
        continue;
      }
      const issueRows = autoCreateOnesByIssueId.get(row.issueId) ?? [];
      issueRows.push(row);
      autoCreateOnesByIssueId.set(row.issueId, issueRows);
    }

    const manualCreateOnesByIssueId = new Map<number, ManualCreateOne[]>();
    for (const row of manualCreateOnes) {
      if (row.issueId === null) {
        continue;
      }
      const issueRows = manualCreateOnesByIssueId.get(row.issueId) ?? [];
      issueRows.push(row);
      manualCreateOnesByIssueId.set(row.issueId, issueRows);
    }

    const assigneesByIssueId = new Map<number, Assignee[]>();
    for (const assignee of assignees) {
      if (assignee.issueId === null) {
        continue;
      }
      const issueAssignees = assigneesByIssueId.get(assignee.issueId) ?? [];
      issueAssignees.push(assignee);
      assigneesByIssueId.set(assignee.issueId, issueAssignees);
    }

    const commentsByIssueId = new Map<number, IssueComment[]>();
    for (const comment of comments) {
      const issueComments = commentsByIssueId.get(comment.issueId) ?? [];
      issueComments.push(comment);
      commentsByIssueId.set(comment.issueId, issueComments);
    }

    const tagsByIssueId = new Map<number, Tag[]>();
    for (const tag of tags) {
      if (tag.issueId === null) {
        continue;
      }
      const issueTags = tagsByIssueId.get(tag.issueId) ?? [];
      issueTags.push(tag);
      tagsByIssueId.set(tag.issueId, issueTags);
    }

    return issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      items: (itemsByIssueId.get(issue.id) ?? []).map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
      })),
      autoCreateOnes: (autoCreateOnesByIssueId.get(issue.id) ?? []).map(
        (row) => ({
          id: row.id,
          externalRef: row.externalRef,
          label: row.label,
          metadata: row.metadata,
        }),
      ),
      manualCreateOnes: (manualCreateOnesByIssueId.get(issue.id) ?? []).map(
        (row) => ({
          id: row.id,
          createdBy: row.createdBy,
          note: row.note,
          recordedAt: row.recordedAt.toISOString(),
        }),
      ),
      assignees: (assigneesByIssueId.get(issue.id) ?? []).map((assignee) => ({
        id: assignee.id,
        displayName: assignee.displayName,
        email: assignee.email,
        team: assignee.team,
      })),
      comments: (commentsByIssueId.get(issue.id) ?? []).map((comment) => ({
        id: comment.id,
        author: comment.author,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      })),
      tags: (tagsByIssueId.get(issue.id) ?? []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
    }));
  }
}
