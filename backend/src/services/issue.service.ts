import { In, Repository } from "typeorm";
import { Issue } from "../entities/issue.entity";
import { IssueDomain } from "../domain/issue.domain";

export class IssueService {
  constructor(private readonly repository: Repository<Issue>) {}

  async findHeavyByItemIds(itemIds: number[]): Promise<IssueDomain[]> {
    // 1. First query: autoCreateOne + manualCreateOne
    const entities = await this.repository.find({
      join: {
        alias: "issue",
        leftJoinAndSelect: {
          item1: "issue.autoCreateOne",
          item2: "issue.manualCreateOne",
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

    // 2. Second query: item + assignee
    const entitiesWithItemAndAssignee = await this.repository.find({
      join: {
        alias: "issue",
        leftJoinAndSelect: {
          item3: "issue.item",
          item4: "issue.assignee",
        },
      },
      where: {
        id: In(issueIds),
      },
    });

    // 3. Third query: comments + tags
    const entitiesWithCommentsAndTags = await this.repository.find({
      join: {
        alias: "issue",
        leftJoinAndSelect: {
          item5: "issue.comments",
          item6: "issue.tags",
        },
      },
      where: {
        id: In(issueIds),
      },
    });

    // 4. Merge the second and third query results
    for (const issue of entities) {
      const issueWithItemAndAssignee = entitiesWithItemAndAssignee.find(
        (result) => result.id === issue.id,
      );

      const issueWithCommentsAndTags = entitiesWithCommentsAndTags.find(
        (result) => result.id === issue.id,
      );

      if (issueWithItemAndAssignee) {
        issue.item = issueWithItemAndAssignee.item;
        issue.assignee = issueWithItemAndAssignee.assignee;
      }

      issue.comments = issueWithCommentsAndTags?.comments ?? [];
      issue.tags = issueWithCommentsAndTags?.tags ?? [];
    }

    // 5. Convert as before
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
