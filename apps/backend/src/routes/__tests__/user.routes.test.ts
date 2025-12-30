import request from 'supertest';
import express from 'express';
import { userRoutes } from '../user.routes.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should handle search query', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ search: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});



