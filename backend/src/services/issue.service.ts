import { In, Repository } from "typeorm";
import { Issue } from "../entities/issue.entity";
import { IssueDomain } from "../domain/issue.domain";

/**
 * Baseline "heavy find" path — refactor this for benchmarks (QueryBuilder, selective select, pagination, etc.).
 */
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
          item5: "issue.comments",
          item6: "issue.tags",
        },
      },
      where: {
        itemId: In(itemIds),
      },
    });

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
