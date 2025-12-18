import { Router, type IRouter } from 'express';
import { createApiResponse, createErrorResponse, type CreateUserRequest } from '@side-project/shared';
import prisma from '../lib/prisma.js';

const router: IRouter = Router();

// GET /api/users - 모든 사용자 조회
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(createApiResponse(users));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json(createErrorResponse('Failed to fetch users', 'DATABASE_ERROR'));
  }
});

// GET /api/users/:id - 특정 사용자 조회
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) {
      return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
    }
    res.json(createApiResponse(user));
  } catch (error) {
    console.error('Failed to fetch user:', error);
    res.status(500).json(createErrorResponse('Failed to fetch user', 'DATABASE_ERROR'));
  }
});

// POST /api/users - 사용자 생성
router.post('/', async (req, res) => {
  try {
    const { name, email }: CreateUserRequest = req.body;

    if (!name || !email) {
      return res.status(400).json(createErrorResponse('Name and email are required', 'VALIDATION_ERROR'));
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    res.status(201).json(createApiResponse(newUser));
  } catch (error: any) {
    console.error('Failed to create user:', error);
    // 이메일 중복 체크
    if (error.code === 'P2002') {
      return res.status(400).json(createErrorResponse('Email already exists', 'DUPLICATE_EMAIL'));
    }
    res.status(500).json(createErrorResponse('Failed to create user', 'DATABASE_ERROR'));
  }
});

// PUT /api/users/:id - 사용자 업데이트
router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    res.json(createApiResponse(updatedUser));
  } catch (error: any) {
    console.error('Failed to update user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
    }
    if (error.code === 'P2002') {
      return res.status(400).json(createErrorResponse('Email already exists', 'DUPLICATE_EMAIL'));
    }
    res.status(500).json(createErrorResponse('Failed to update user', 'DATABASE_ERROR'));
  }
});

// DELETE /api/users/:id - 사용자 삭제
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });
    res.json(createApiResponse({ message: 'User deleted successfully' }));
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
    }
    res.status(500).json(createErrorResponse('Failed to delete user', 'DATABASE_ERROR'));
  }
});

export { router as userRoutes };

