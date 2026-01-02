import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { createApiResponse, createErrorResponse, updateUserSchema, type PaginatedResponse, type User } from '@side-project/shared';
import prisma from '../lib/prisma.js';
import type { User as PrismaUser } from '@prisma/client';
import { parseSearchQuery } from '../lib/openai.js';
import { logActivity } from '../lib/activityLogger.js';

const router: IRouter = Router();

// GET /api/users - 모든 사용자 조회 (페이징 및 검색 지원)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    // 페이지 번호와 limit 유효성 검사
    if (page < 1) {
      return res.status(400).json(createErrorResponse('Page must be greater than 0', 'INVALID_PAGE'));
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json(createErrorResponse('Limit must be between 1 and 100', 'INVALID_LIMIT'));
    }

    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const _where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // SQLite는 case-insensitive를 지원하지 않으므로 contains만 사용
    const whereForSqlite = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    // 전체 개수 조회
    const total = await prisma.user.count({
      where: whereForSqlite,
    });

    // 사용자 목록 조회
    const users = await prisma.user.findMany({
      where: whereForSqlite,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    // Date를 string으로 변환
    const formattedUsers: User[] = users.map((user: PrismaUser) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    const response: PaginatedResponse<User> = {
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    res.json(createApiResponse(response));
  } catch (error) {
    next(error); // 에러 미들웨어로 전달
  }
});

// GET /api/users/:id - 특정 사용자 조회
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) {
      return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
    }
    // Date를 string으로 변환
    const formattedUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    res.json(createApiResponse(formattedUser));
  } catch (error) {
    next(error); // 에러 미들웨어로 전달
  }
});

// POST /api/users - 사용자 생성 (제거됨, 회원가입은 /api/auth/register 사용)

// PUT /api/users/:id - 사용자 업데이트
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Zod 검증 (에러 발생 시 ZodError가 throw됨)
    let validatedData;
    try {
      validatedData = updateUserSchema.parse(req.body);
    } catch (error) {
      return next(error); // ZodError를 미들웨어로 전달
    }

    // 변경 전 사용자 정보 가져오기 (활동 로그용)
    const oldUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        name: true,
        email: true,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: validatedData,
    });

    // Date를 string으로 변환
    const formattedUser: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    // 실시간 알림 전송
    const io = req.app.get('io');
    if (io) {
      io.emit('notification', {
        type: 'user_updated',
        message: `${formattedUser.name}님의 정보가 업데이트되었습니다`,
        data: {
          userId: formattedUser.id,
          name: formattedUser.name,
          email: formattedUser.email,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 활동 로그 저장
    const userId = (req as any).user?.userId || null;
    await logActivity({
      userId,
      action: 'user_update',
      entity: 'user',
      entityId: updatedUser.id,
      details: {
        before: oldUser,
        after: {
          name: updatedUser.name,
          email: updatedUser.email,
        },
        changedFields: Object.keys(validatedData),
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(createApiResponse(formattedUser));
  } catch (error: any) {
    next(error); // 에러 미들웨어로 전달
  }
});

// DELETE /api/users/:id - 사용자 삭제
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 삭제 전에 사용자 정보 가져오기 (알림용)
    const userToDelete = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    // 실시간 알림 전송
    const io = req.app.get('io');
    if (io && userToDelete) {
      io.emit('notification', {
        type: 'user_deleted',
        message: `${userToDelete.name}님이 삭제되었습니다`,
        data: {
          userId: userToDelete.id,
          name: userToDelete.name,
          email: userToDelete.email,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 활동 로그 저장
    const userId = (req as any).user?.userId || null;
    if (userToDelete) {
      await logActivity({
        userId,
        action: 'user_delete',
        entity: 'user',
        entityId: userToDelete.id,
        details: {
          deletedUser: {
            name: userToDelete.name,
            email: userToDelete.email,
          },
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    res.json(createApiResponse({ message: 'User deleted successfully' }));
  } catch (error: any) {
    next(error); // 에러 미들웨어로 전달
  }
});

// POST /api/users/ai-search - AI 기반 스마트 검색
router.post('/ai-search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, page = 1, limit = 10 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json(createErrorResponse('검색 쿼리가 필요합니다', 'INVALID_QUERY'));
    }

    const pageNum = parseInt(String(page)) || 1;
    const limitNum = parseInt(String(limit)) || 10;

    if (pageNum < 1) {
      return res.status(400).json(createErrorResponse('Page must be greater than 0', 'INVALID_PAGE'));
    }
    if (limitNum < 1 || limitNum > 100) {
      return res.status(400).json(createErrorResponse('Limit must be between 1 and 100', 'INVALID_LIMIT'));
    }

    const skip = (pageNum - 1) * limitNum;

    // OpenAI를 사용하여 자연어 쿼리를 Prisma 조건으로 변환
    const whereCondition = await parseSearchQuery(query);

    // 전체 개수 조회
    const total = await prisma.user.count({
      where: whereCondition,
    });

    // 사용자 목록 조회
    const users = await prisma.user.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    const totalPages = Math.ceil(total / limitNum);

    // Date를 string으로 변환
    const formattedUsers: User[] = users.map((user: PrismaUser) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    const response: PaginatedResponse<User> = {
      data: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };

    res.json(createApiResponse(response));
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };

