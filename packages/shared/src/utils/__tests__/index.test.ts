import { createApiResponse, createErrorResponse, formatDate } from '../index';

describe('Utils', () => {
  describe('createApiResponse', () => {
    it('should create a success response', () => {
      const data = { id: 1, name: 'Test' };
      const response = createApiResponse(data);

      expect(response).toEqual({
        success: true,
        data,
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response', () => {
      const response = createErrorResponse('Error message', 'ERROR_CODE');

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Error message',
          code: 'ERROR_CODE',
        },
      });
    });
  });

  describe('formatDate', () => {
    it('should format a Date object', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toBe('2024-01-01');
    });

    it('should format a date string', () => {
      const formatted = formatDate('2024-01-01T00:00:00Z');

      expect(formatted).toBe('2024-01-01');
    });
  });
});


