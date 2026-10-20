export interface IssueDomain {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    sku: string;
    name: string;
    description: string | null;
  }>;
  autoCreateOnes: Array<{
    id: number;
    externalRef: string;
    label: string;
    metadata: Record<string, unknown>;
  }>;
  manualCreateOnes: Array<{
    id: number;
    createdBy: string;
    note: string;
    recordedAt: string;
  }>;
  assignees: Array<{
    id: number;
    displayName: string;
    email: string;
    team: string;
  }>;
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
