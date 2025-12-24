import { Request, Response, NextFunction } from 'express';
import { ZodError } from '@side-project/shared';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { createErrorResponse, formatZodError } from '@side-project/shared';
import logger from '../lib/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError | ZodError | PrismaClientKnownRequestError | PrismaClientValidationError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Zod 검증 에러
  if (err instanceof ZodError) {
    return res.status(400).json(formatZodError(err));
  }

  // Prisma 에러
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        return res.status(400).json(
          createErrorResponse('중복된 값이 있습니다', 'DUPLICATE_ERROR')
        );
      case 'P2025':
        // Record not found
        return res.status(404).json(
          createErrorResponse('레코드를 찾을 수 없습니다', 'NOT_FOUND')
        );
      case 'P2003':
        // Foreign key constraint violation
        return res.status(400).json(
          createErrorResponse('관련된 레코드가 존재합니다', 'FOREIGN_KEY_ERROR')
        );
      default:
        logger.error('Prisma error:', err);
        return res.status(500).json(
          createErrorResponse('데이터베이스 오류가 발생했습니다', 'DATABASE_ERROR')
        );
    }
  }

  // Prisma validation error
  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json(
      createErrorResponse('잘못된 데이터 형식입니다', 'VALIDATION_ERROR')
    );
  }

  // 커스텀 AppError
  if ('statusCode' in err && err.statusCode) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.message, err.code)
    );
  }

  // 기본 에러 처리
  logger.error('Unhandled error:', err);
  const statusCode = 'statusCode' in err ? err.statusCode || 500 : 500;
  return res.status(statusCode).json(
    createErrorResponse(
      process.env.NODE_ENV === 'production'
        ? '서버 오류가 발생했습니다'
        : err.message,
      'INTERNAL_ERROR'
    )
  );
};

