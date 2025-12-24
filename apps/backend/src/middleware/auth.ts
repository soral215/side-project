import { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../lib/jwt.js';
import { createErrorResponse } from '@side-project/shared';

// Express Request에 user 속성 추가
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        createErrorResponse('인증 토큰이 필요합니다', 'UNAUTHORIZED')
      );
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json(
        createErrorResponse('유효하지 않거나 만료된 토큰입니다', 'INVALID_TOKEN')
      );
    }
  } catch (error) {
    return res.status(401).json(
      createErrorResponse('인증에 실패했습니다', 'AUTH_ERROR')
    );
  }
};


