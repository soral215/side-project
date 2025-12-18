import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { createApiResponse, createErrorResponse } from '@side-project/shared';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router: IRouter = Router();

// POST /api/upload - 이미지 업로드 (인증 필요)
router.post(
  '/',
  authenticate,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json(
          createErrorResponse('이미지 파일이 필요합니다', 'MISSING_FILE')
        );
      }

      // 파일 URL 생성 (실제로는 클라우드 스토리지 URL이 될 수 있음)
      const fileUrl = `/uploads/${req.file.filename}`;

      // 사용자 프로필 이미지 업데이트
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { imageUrl: fileUrl },
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
          fileUrl,
          user: {
            ...updatedUser,
            createdAt: updatedUser.createdAt.toISOString(),
            updatedAt: updatedUser.updatedAt.toISOString(),
          },
        })
      );
    } catch (error: any) {
      next(error);
    }
  }
);

export { router as uploadRoutes };

