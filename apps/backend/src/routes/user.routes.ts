import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { createApiResponse, createErrorResponse, updateUserSchema, type PaginatedResponse, type User } from '@side-project/shared';
import prisma from '../lib/prisma.js';
import type { User as PrismaUser } from '@prisma/client';

const router: IRouter = Router();

// GET /api/users - 모든 사용자 조회 (페이징 및 검색 지원)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user.routes.ts:9',message:'GET /api/users 라우트 핸들러 진입',data:{query:req.query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user.routes.ts:45',message:'prisma.user.count() 호출 전 상태 확인',data:{databaseUrl:process.env.DATABASE_URL,cwd:process.cwd(),whereForSqlite},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 전체 개수 조회
    const total = await prisma.user.count({
      where: whereForSqlite,
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user.routes.ts:50',message:'prisma.user.count() 호출 완료',data:{total},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user.routes.ts:81',message:'에러 발생',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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

    res.json(createApiResponse(formattedUser));
  } catch (error: any) {
    next(error); // 에러 미들웨어로 전달
  }
});

// DELETE /api/users/:id - 사용자 삭제
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });
    res.json(createApiResponse({ message: 'User deleted successfully' }));
  } catch (error: any) {
    next(error); // 에러 미들웨어로 전달
  }
});

export { router as userRoutes };

