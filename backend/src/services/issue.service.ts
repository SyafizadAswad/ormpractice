import { In, Repository } from "typeorm";
import { Issue } from "../entities/issue.entity";
import { IssueDomain } from "../domain/issue.domain";

export class IssueService {
  constructor(private readonly repository: Repository<Issue>) {}

  async findHeavyByItemIds(itemIds: number[]): Promise<IssueDomain[]> {
    // 1. Fetch issues with the four single-record relations
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

    // 2. Fetch comments and tags separately, at the same time
    const [entitiesWithComments, entitiesWithTags] = await Promise.all([
      this.repository.find({
        join: {
          alias: "issue",
          leftJoinAndSelect: {
            item5: "issue.comments",
          },
        },
        where: {
          id: In(issueIds),
        },
      }),

      this.repository.find({
        join: {
          alias: "issue",
          leftJoinAndSelect: {
            item6: "issue.tags",
          },
        },
        where: {
          id: In(issueIds),
        },
      }),
    ]);

    // 3. Create maps for quick lookup by issue ID
    const commentsByIssueId = new Map(
      entitiesWithComments.map((issue) => [issue.id, issue.comments ?? []]),
    );

    const tagsByIssueId = new Map(
      entitiesWithTags.map((issue) => [issue.id, issue.tags ?? []]),
    );

    // 4. Attach the collections to the original issues
    for (const issue of entities) {
      issue.comments = commentsByIssueId.get(issue.id) ?? [];
      issue.tags = tagsByIssueId.get(issue.id) ?? [];
    }

    // 5. Keep your existing conversion unchanged
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
