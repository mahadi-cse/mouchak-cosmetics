export interface AuditLog {
  id: number;
  userId: number | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  action: string;
  entity: string;
  entityId: string;
  entityLabel: string | null;
  before: any;
  after: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  search?: string;
}
