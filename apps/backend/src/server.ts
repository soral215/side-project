import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { createApiResponse, createErrorResponse } from '@side-project/shared';
import { userRoutes } from './routes/user.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { profileRoutes } from './routes/profile.routes.js';
import { statsRoutes } from './routes/stats.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { activityRoutes } from './routes/activity.routes.js';
import { model3dRoutes } from './routes/model3d.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import logger from './lib/logger.js';
import { swaggerSpec } from './swagger.js';
import { verifyToken } from './lib/jwt.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging (Winston)
app.use(requestLogger);

// Root endpoint
app.get('/', (req, res) => {
  res.json(createApiResponse({
    message: 'Backend API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      auth: '/api/auth',
      profile: '/api/profile',
      stats: '/api/stats',
      activity: '/api/activity',
      model3d: '/api/3d',
    },
    timestamp: new Date().toISOString(),
  }));
});

// Health check
app.get('/health', (req, res) => {
  res.json(createApiResponse({ status: 'ok', timestamp: new Date().toISOString() }));
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/3d', model3dRoutes);

// 정적 파일 서빙 (로컬 업로드 이미지 - Cloudinary 사용 시 불필요하지만 호환성을 위해 유지)
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use((req, res) => {
  res.status(404).json(createErrorResponse('Route not found', 'NOT_FOUND'));
});

// Error handler (모든 에러를 처리하는 미들웨어)
app.use(errorHandler);

// Socket.io 연결 처리
io.use((socket, next) => {
  try {
    // 클라이언트: io(url, { auth: { token } })
    const token = (socket.handshake.auth as any)?.token as string | undefined;
    if (!token) {
      return next(new Error('인증 토큰이 필요합니다'));
    }
    const payload = verifyToken(token);
    // socket.data에 사용자 정보 저장
    (socket.data as any).userId = payload.userId;
    return next();
  } catch {
    return next(new Error('유효하지 않거나 만료된 토큰입니다'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket.data as any)?.userId as string | undefined;
  if (userId) {
    socket.join(`user:${userId}`);
  }
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Socket.io 인스턴스를 app에 추가 (라우트에서 사용 가능하도록)
app.set('io', io);

httpServer.listen(PORT, () => {
  logger.info(`🚀 Backend server running on http://localhost:${PORT}`);
});

