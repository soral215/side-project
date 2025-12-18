import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { createApiResponse, createErrorResponse } from '@side-project/shared';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import cloudinary from '../lib/cloudinary.js';
import { Readable } from 'stream';

const router: IRouter = Router();

// Multer 설정 (메모리 저장소 사용 - Cloudinary로 직접 업로드)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다'));
    }
  },
});

// 파일을 Cloudinary에 업로드하는 헬퍼 함수
const uploadToCloudinary = (buffer: Buffer, folder: string = 'profiles'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // 프로필 이미지 최적화
          { quality: 'auto' }, // 자동 품질 최적화
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url); // HTTPS URL 반환
        } else {
          reject(new Error('Cloudinary 업로드 실패'));
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

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

      // Cloudinary에 업로드
      const imageUrl = await uploadToCloudinary(req.file.buffer, 'profiles');

      // 사용자 프로필 이미지 업데이트
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { imageUrl },
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
          fileUrl: imageUrl,
          user: {
            ...updatedUser,
            createdAt: updatedUser.createdAt.toISOString(),
            updatedAt: updatedUser.updatedAt.toISOString(),
          },
        })
      );
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      next(error);
    }
  }
);

export { router as uploadRoutes };

