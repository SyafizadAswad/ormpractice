import { In, Repository } from "typeorm";
import { Issue } from "../entities/issue.entity";
import { IssueDomain } from "../domain/issue.domain";
import { IssueComment } from "../entities/issue-comment.entity";
import { Tag } from "../entities/tag.entity";

export class IssueService {
  constructor(private readonly repository: Repository<Issue>) {}

  async findHeavyByItemIds(itemIds: number[]): Promise<IssueDomain[]> {
    const entities = await this.repository.find({
      join: {
        alias: "issue",
        leftJoinAndSelect: {
          item1: "issue.autoCreateOne",
          item2: "issue.manualCreateOne",
          item3: "issue.item",
          item4: "issue.assignee",
        },
      },
      where: {
        itemId: In(itemIds),
      },
    });

    if (entities.length === 0) {
      return [];
    }

    const issueIds = entities.map((issue) => issue.id);
    const [comments, tagRows] = await Promise.all([
      this.repository.manager.getRepository(IssueComment).find({
        select: ["id", "issueId", "author", "body", "createdAt"],
        where: { issueId: In(issueIds) },
      }),
      this.repository.manager
        .getRepository(Tag)
        .createQueryBuilder("tag")
        .innerJoin("tag.issues", "issue")
        .select("issue.id", "issueId")
        .addSelect("tag.id", "tagId")
        .addSelect("tag.name", "tagName")
        .addSelect("tag.color", "tagColor")
        .where("issue.id IN (:...issueIds)", { issueIds })
        .getRawMany<{
          issueId: number;
          tagId: number;
          tagName: string;
          tagColor: string;
        }>(),
    ]);

    const commentsByIssueId = new Map<number, IssueComment[]>();
    for (const comment of comments) {
      const issueComments = commentsByIssueId.get(comment.issueId) ?? [];
      issueComments.push(comment);
      commentsByIssueId.set(comment.issueId, issueComments);
    }

    const tagsByIssueId = new Map<number, Tag[]>();
    for (const row of tagRows) {
      const issueTags = tagsByIssueId.get(row.issueId) ?? [];
      issueTags.push({
        id: row.tagId,
        name: row.tagName,
        color: row.tagColor,
        issues: [],
      });
      tagsByIssueId.set(row.issueId, issueTags);
    }

    for (const issue of entities) {
      issue.comments = commentsByIssueId.get(issue.id) ?? [];
      issue.tags = tagsByIssueId.get(issue.id) ?? [];
    }

    return this.convertEntityToDomainCollection(entities);
  }

  convertEntityToDomainCollection(entities: Issue[]): IssueDomain[] {
    return entities.map((issue) => ({
      id: issue.id,
      itemId: issue.itemId,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      item: issue.item
        ? {
            id: issue.item.id,
            sku: issue.item.sku,
            name: issue.item.name,
            description: issue.item.description,
          }
        : null,
      autoCreateOne: issue.autoCreateOne
        ? {
            id: issue.autoCreateOne.id,
            externalRef: issue.autoCreateOne.externalRef,
            label: issue.autoCreateOne.label,
            metadata: issue.autoCreateOne.metadata,
          }
        : null,
      manualCreateOne: issue.manualCreateOne
        ? {
            id: issue.manualCreateOne.id,
            createdBy: issue.manualCreateOne.createdBy,
            note: issue.manualCreateOne.note,
            recordedAt: issue.manualCreateOne.recordedAt.toISOString(),
          }
        : null,
      assignee: issue.assignee
        ? {
            id: issue.assignee.id,
            displayName: issue.assignee.displayName,
            email: issue.assignee.email,
            team: issue.assignee.team,
          }
        : null,
      comments: (issue.comments ?? []).map((c) => ({
        id: c.id,
        author: c.author,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
      })),
      tags: (issue.tags ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })),
    }));
  }
}
