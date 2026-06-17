import { prisma } from '../../config/database';
import { Request } from 'express';

export class AuditLogger {
  static async log({
    req,
    userId,
    action,
    entity,
    entityId,
    entityLabel,
    before = null,
    after = null,
    orderId = null,
  }: {
    req?: Request;
    userId?: number;
    action: string;
    entity: string;
    entityId: string;
    entityLabel?: string;
    before?: any;
    after?: any;
    orderId?: number | null;
  }) {
    try {
      const resolvedUserId = userId ?? (req as any)?.user?.id ?? null;
      const ipAddress = req ? (req.ip || req.socket.remoteAddress || null) : null;
      const userAgent = req ? (req.headers['user-agent'] || null) : null;

      await prisma.auditLog.create({
        data: {
          userId: resolvedUserId,
          action,
          entity,
          entityId,
          entityLabel: entityLabel || `${entity} #${entityId}`,
          before: before ? JSON.parse(JSON.stringify(before)) : null,
          after: after ? JSON.parse(JSON.stringify(after)) : null,
          ipAddress,
          userAgent,
          orderId,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}
