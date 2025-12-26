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
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import logger from './lib/logger.js';
import { swaggerSpec } from './swagger.js';

dotenv.config();

// #region agent log
fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:17',message:'dotenv.config() 실행 후 DATABASE_URL 확인',data:{databaseUrl:process.env.DATABASE_URL,nodeEnv:process.env.NODE_ENV,cwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

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

// 정적 파일 서빙 (로컬 업로드 이미지 - Cloudinary 사용 시 불필요하지만 호환성을 위해 유지)
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use((req, res) => {
  res.status(404).json(createErrorResponse('Route not found', 'NOT_FOUND'));
});

// Error handler (모든 에러를 처리하는 미들웨어)
app.use(errorHandler);

// Socket.io 연결 처리
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });

  // 사용자 목록 업데이트 알림
  socket.on('user:updated', (data: any) => {
    socket.broadcast.emit('user:updated', data);
  });

  // 새 사용자 생성 알림
  socket.on('user:created', (data: any) => {
    socket.broadcast.emit('user:created', data);
  });
});

// Socket.io 인스턴스를 app에 추가 (라우트에서 사용 가능하도록)
app.set('io', io);

httpServer.listen(PORT, () => {
  logger.info(`🚀 Backend server running on http://localhost:${PORT}`);
});

