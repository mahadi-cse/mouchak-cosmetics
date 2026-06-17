import { Router } from "express";
import { prisma } from "../../config/database";
import { authenticate, authorize } from "../../middleware/authenticate";
import { USER_TYPE_CODES } from "../../shared/types/auth.types";
import { parsePagination } from "../../shared/utils/pagination";

const router = Router();

router.get("/", authenticate, authorize(USER_TYPE_CODES.SYSTEM_ADMIN, USER_TYPE_CODES.MANAGER), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string || "1");
    const limit = parseInt(req.query.limit as string || "20");
    const entity = req.query.entity as string;
    const action = req.query.action as string;
    const search = req.query.search as string;

    const { skip, take } = parsePagination({ page, limit });

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { entityLabel: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      data: logs,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;
