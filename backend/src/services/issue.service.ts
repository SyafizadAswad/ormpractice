import { In, Repository } from "typeorm";
import { Assignee } from "../entities/assignee.entity";
import { AutoCreateOne } from "../entities/auto-create-one.entity";
import { IssueComment } from "../entities/issue-comment.entity";
import { Issue } from "../entities/issue.entity";
import { Item } from "../entities/item.entity";
import { ManualCreateOne } from "../entities/manual-create-one.entity";
import { Tag } from "../entities/tag.entity";
import { IssueDomain } from "../domain/issue.domain";

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
