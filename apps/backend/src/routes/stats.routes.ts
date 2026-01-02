import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { createApiResponse, createErrorResponse } from '@side-project/shared';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router: IRouter = Router();

// 모든 통계 라우트는 인증 필요
router.use(authenticate);

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: 대시보드 통계 개요
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 통계 데이터
 */
// GET /api/stats/overview - 통계 개요
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 총 사용자 수
    const totalUsers = await prisma.user.count();

    // 최근 7일간 가입자 수
    const recentUsers7d = await prisma.user.count({
      where: {
        createdAt: {
          gte: last7Days,
        },
      },
    });

    // 최근 30일간 가입자 수
    const recentUsers30d = await prisma.user.count({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
    });

    // 오늘 가입자 수
    const todayUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 이전 7일간 가입자 수 (비교용)
    const previous7Days = new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousUsers7d = await prisma.user.count({
      where: {
        createdAt: {
          gte: previous7Days,
          lt: last7Days,
        },
      },
    });

    // 증가율 계산
    const growthRate = previousUsers7d > 0 
      ? Math.round(((recentUsers7d - previousUsers7d) / previousUsers7d) * 100)
      : recentUsers7d > 0 ? 100 : 0;

    res.json(
      createApiResponse({
        totalUsers,
        recentUsers7d,
        recentUsers30d,
        todayUsers,
        growthRate,
      })
    );
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/activity:
 *   get:
 *     summary: 주간 사용자 활동 추이
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 주간 활동 데이터
 */
// GET /api/stats/activity - 주간 활동 추이
router.get('/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const weekData = [];

    // 최근 7일 데이터
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const dayUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // 활성 사용자 (최근 7일 내 업데이트된 사용자)
      const activeUsers = await prisma.user.count({
        where: {
          updatedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      weekData.push({
        name: days[date.getDay()],
        users: dayUsers,
        active: activeUsers,
        date: date.toISOString().split('T')[0],
      });
    }

    res.json(createApiResponse(weekData));
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/hourly:
 *   get:
 *     summary: 시간대별 가입 분포
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 시간대별 데이터
 */
// GET /api/stats/hourly - 시간대별 활동
router.get('/hourly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        createdAt: true,
      },
    });

    // 시간대별 그룹화 (0-23시)
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    allUsers.forEach((user) => {
      const hour = new Date(user.createdAt).getHours();
      hourlyData[hour].count += 1;
    });

    res.json(createApiResponse(hourlyData));
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/user-types:
 *   get:
 *     summary: 사용자 유형 분포
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 유형 데이터
 */
// GET /api/stats/user-types - 사용자 유형 분포
router.get('/user-types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 신규 사용자 (최근 30일)
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
    });

    // 활성 사용자 (30-90일)
    const activeUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: last90Days,
          lt: last30Days,
        },
      },
    });

    // 기존 사용자 (90일 이상)
    const existingUsers = await prisma.user.count({
      where: {
        createdAt: {
          lt: last90Days,
        },
      },
    });

    res.json(
      createApiResponse([
        { name: '신규 사용자', value: newUsers },
        { name: '활성 사용자', value: activeUsers },
        { name: '기존 사용자', value: existingUsers },
      ])
    );
  } catch (error: any) {
    next(error);
  }
});

export { router as statsRoutes };



