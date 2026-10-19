export interface IssueDomain {
  id: number;
  itemId: number;
  title: string;
  description: string;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  item: {
    id: number;
    sku: string;
    name: string;
    description: string | null;
  } | null;
  autoCreateOne: {
    id: number;
    externalRef: string;
    label: string;
    metadata: Record<string, unknown>;
  } | null;
  manualCreateOne: {
    id: number;
    createdBy: string;
    note: string;
    recordedAt: string;
  } | null;
  assignee: {
    id: number;
    displayName: string;
    email: string;
    team: string;
  } | null;
  comments: Array<{
    id: number;
    author: string;
    body: string;
    createdAt: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}
