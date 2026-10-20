import { Repository } from "typeorm";
import { IssueDomain } from "../domain/issue.domain";
import { Issue } from "../entities/issue.entity";

export class IssueService {
  constructor(private readonly issueRepository: Repository<Issue>) {}

  async findHeavyByItemIds(itemIds: number[]): Promise<IssueDomain[]> {
    const issues = await this.issueRepository
      .createQueryBuilder("issue")
      .leftJoinAndSelect("issue.items", "item")
      .leftJoinAndSelect("issue.autoCreateOnes", "autoCreateOne")
      .leftJoinAndSelect("issue.manualCreateOnes", "manualCreateOne")
      .leftJoinAndSelect("issue.assignees", "assignee")
      .leftJoinAndSelect("issue.comments", "comment")
      .leftJoinAndSelect("issue.tags", "tag")
      .where("item.id IN (:...itemIds)", { itemIds })
      .getMany();

    return issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      items: (issue.items ?? []).map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
      })),
      autoCreateOnes: (issue.autoCreateOnes ?? []).map((row) => ({
        id: row.id,
        externalRef: row.externalRef,
        label: row.label,
        metadata: row.metadata,
      })),
      manualCreateOnes: (issue.manualCreateOnes ?? []).map((row) => ({
        id: row.id,
        createdBy: row.createdBy,
        note: row.note,
        recordedAt: row.recordedAt.toISOString(),
      })),
      assignees: (issue.assignees ?? []).map((assignee) => ({
        id: assignee.id,
        displayName: assignee.displayName,
        email: assignee.email,
        team: assignee.team,
      })),
      comments: (issue.comments ?? []).map((comment) => ({
        id: comment.id,
        author: comment.author,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      })),
      tags: (issue.tags ?? []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
    }));
  }
}
