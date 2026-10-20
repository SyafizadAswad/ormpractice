import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ItemMeta {
  id: number;
  sku: string;
  name: string;
}

export interface IssuesResponse {
  meta: {
    itemIdCount: number;
    issueCount: number;
    serverMs: number;
  };
  data: IssueRow[];
}

export interface IssueRow {
  id: number;
  title: string;
  status: string;
  priority: number;
  items: { id: number; sku: string; name: string }[];
  assignees: { displayName: string; team: string }[];
  tags: { name: string; color: string }[];
  comments: { id: number }[];
}

@Injectable({ providedIn: 'root' })
export class IssuesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  listItemMeta(): Observable<{ items: ItemMeta[] }> {
    return this.http.get<{ items: ItemMeta[] }>(`${this.base}/issues/meta/items`);
  }

  fetchIssues(itemIds: number[]): Observable<IssuesResponse> {
    const itemIdsParam = itemIds.join(',');
    return this.http.get<IssuesResponse>(`${this.base}/issues`, {
      params: { itemIds: itemIdsParam },
    });
  }
}
