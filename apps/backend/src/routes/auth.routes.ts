import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { createApiResponse, registerSchema, loginSchema } from '@side-project/shared';
import prisma from '../lib/prisma.js';
import { generateToken } from '../lib/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { logActivity } from '../lib/activityLogger.js';

const router: IRouter = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 검증 실패
 */
// POST /api/auth/register - 회원가입
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Zod 검증
    let validatedData;
    try {
      validatedData = registerSchema.parse(req.body);
    } catch (error) {
      return next(error);
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // JWT 토큰 생성
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // 실시간 알림 전송
    const io = req.app.get('io');
    if (io) {
      io.emit('notification', {
        type: 'user_created',
        message: `${newUser.name}님이 가입했습니다`,
        data: {
          userId: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 활동 로그 저장
    await logActivity({
      userId: newUser.id,
      action: 'user_register',
      entity: 'user',
      entityId: newUser.id,
      details: {
        name: newUser.name,
        email: newUser.email,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(
      createApiResponse({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString(),
        },
        token,
      })
    );
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: 인증 실패
 */
// POST /api/auth/login - 로그인
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Zod 검증
    let validatedData;
    try {
      validatedData = loginSchema.parse(req.body);
    } catch (error) {
      return next(error);
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return res.status(401).json(
        createApiResponse(null, false)
      );
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(
        createApiResponse(null, false)
      );
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // 활동 로그 저장
    await logActivity({
      userId: user.id,
      action: 'user_login',
      entity: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(
      createApiResponse({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      })
    );
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: 인증 실패
 */
// GET /api/auth/me - 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json(
        createApiResponse(null, false)
      );
    }

    res.json(
      createApiResponse({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })
    );
  } catch (error: any) {
    next(error);
  }
});

export { router as authRoutes };

