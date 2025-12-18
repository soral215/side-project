import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createApiResponse, createErrorResponse } from '@side-project/shared';
import { userRoutes } from './routes/user.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json(createApiResponse({
    message: 'Backend API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
    },
    timestamp: new Date().toISOString(),
  }));
});

// Health check
app.get('/health', (req, res) => {
  res.json(createApiResponse({ status: 'ok', timestamp: new Date().toISOString() }));
});

// Routes
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json(createErrorResponse('Route not found', 'NOT_FOUND'));
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'));
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

