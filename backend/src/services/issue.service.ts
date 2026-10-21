import { In, Repository } from "typeorm";
import { Issue } from "../entities/issue.entity";
import { IssueComment } from "../entities/issue-comment.entity";
import { Tag } from "../entities/tag.entity";
import { IssueDomain } from "../domain/issue.domain";

export class IssueService {
  constructor(
    private readonly repository: Repository<Issue>,
    private readonly commentRepository: Repository<IssueComment>,
  ) {}

  async findHeavyByItemIds(itemIds: number[]): Promise<IssueDomain[]> {
    // 1. Fetch issues and their single-record relations
    const issues = await this.repository.find({
      where: { itemId: In(itemIds) },
      relations: {
        autoCreateOne: true,
        manualCreateOne: true,
        item: true,
        assignee: true,
      },
    });

    if (issues.length === 0) {
      return [];
    }

    // 2. Collect the IDs of the issues
    const issueIds = issues.map((issue) => issue.id);

    // 3. Fetch all comments belonging to these issues
    const comments = await this.commentRepository.find({
      where: { issueId: In(issueIds) },
    });

    // 4. Fetch issues with their tags
    const issuesWithTags = await this.repository.find({
      where: { id: In(issueIds) },
      relations: { tags: true },
    });

    // 5. Attach comments and tags to each issue
    for (const issue of issues) {
      issue.comments = comments.filter(
        (comment) => comment.issueId === issue.id,
      );

      const issueWithTags = issuesWithTags.find(
        (result) => result.id === issue.id,
      );

      issue.tags = issueWithTags?.tags ?? [];
    }

    // 6. Convert to domain objects
    return this.convertEntityToDomainCollection(issues);
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
