import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { createApiResponse, createErrorResponse, type PaginatedResponse } from '@side-project/shared';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router: IRouter = Router();

// 모든 활동 로그 라우트는 인증 필요
router.use(authenticate);

/**
 * GET /api/activity
 * 활동 로그 조회 (페이징 및 필터링 지원)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const action = req.query.action as string | undefined;
    const userId = req.query.userId as string | undefined;
    const entity = req.query.entity as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // 페이지 번호와 limit 유효성 검사
    if (page < 1) {
      return res.status(400).json(createErrorResponse('Page must be greater than 0', 'INVALID_PAGE'));
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json(createErrorResponse('Limit must be between 1 and 100', 'INVALID_LIMIT'));
    }

    const skip = (page - 1) * limit;

    // 필터 조건 구성
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (entity) {
      where.entity = entity;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 전체 개수 조회
    const total = await prisma.activityLog.count({
      where,
    });

    // 활동 로그 목록 조회
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    // Date를 string으로 변환하고 details 파싱
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details ? JSON.parse(log.details) : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    }));

    const response: PaginatedResponse<typeof formattedLogs[0]> = {
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    res.json(createApiResponse(response));
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/activity/stats
 * 활동 로그 통계
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 액션별 통계
    const actionStats = await prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // 엔티티별 통계
    const entityStats = await prisma.activityLog.groupBy({
      by: ['entity'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // 최근 7일간 활동 추이
    const weekData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const count = await prisma.activityLog.count({
        where: {
          ...where,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      weekData.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    res.json(
      createApiResponse({
        actionStats: actionStats.map((stat) => ({
          action: stat.action,
          count: stat._count.id,
        })),
        entityStats: entityStats
          .filter((stat) => stat.entity)
          .map((stat) => ({
            entity: stat.entity,
            count: stat._count.id,
          })),
        weekTrend: weekData,
        total: await prisma.activityLog.count({ where }),
      })
    );
  } catch (error: any) {
    next(error);
  }
});

export { router as activityRoutes };

