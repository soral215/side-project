import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { createApiResponse, createErrorResponse, updateProfileSchema, changePasswordSchema, formatZodError, ZodError } from '@side-project/shared';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router: IRouter = Router();

// 모든 프로필 라우트는 인증 필요
router.use(authenticate);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: 현재 사용자 프로필 조회
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: 인증 실패
 */
// GET /api/profile - 프로필 조회
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse('사용자를 찾을 수 없습니다', 'USER_NOT_FOUND')
      );
    }

    res.json(
      createApiResponse({
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })
    );
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: 프로필 수정
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *       400:
 *         description: 검증 실패
 */
// PUT /api/profile - 프로필 수정
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Zod 검증
    let validatedData;
    try {
      validatedData = updateProfileSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      return next(error);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(
      createApiResponse({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        imageUrl: updatedUser.imageUrl,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      })
    );
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json(
        createErrorResponse('이미 사용 중인 이메일입니다', 'DUPLICATE_EMAIL')
      );
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: 비밀번호 변경
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *       400:
 *         description: 검증 실패 또는 현재 비밀번호 불일치
 */
// PUT /api/profile/password - 비밀번호 변경
router.put('/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Zod 검증
    let validatedData;
    try {
      validatedData = changePasswordSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      return next(error);
    }

    // 현재 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse('사용자를 찾을 수 없습니다', 'USER_NOT_FOUND')
      );
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json(
        createErrorResponse('현재 비밀번호가 올바르지 않습니다', 'INVALID_PASSWORD')
      );
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    });

    res.json(
      createApiResponse({ message: '비밀번호가 성공적으로 변경되었습니다' })
    );
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: 계정 삭제
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 계정 삭제 성공
 *       400:
 *         description: 비밀번호 불일치
 */
// DELETE /api/profile - 계정 삭제
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json(
        createErrorResponse('비밀번호를 입력해주세요', 'MISSING_PASSWORD')
      );
    }

    // 현재 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse('사용자를 찾을 수 없습니다', 'USER_NOT_FOUND')
      );
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json(
        createErrorResponse('비밀번호가 올바르지 않습니다', 'INVALID_PASSWORD')
      );
    }

    // 계정 삭제 (Cascade로 관련 데이터도 삭제됨)
    await prisma.user.delete({
      where: { id: req.user!.userId },
    });

    res.json(
      createApiResponse({ message: '계정이 성공적으로 삭제되었습니다' })
    );
  } catch (error: any) {
    next(error);
  }
});

export { router as profileRoutes };


