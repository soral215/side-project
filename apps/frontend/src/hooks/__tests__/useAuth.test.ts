import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin, useRegister } from '../useAuth';
import * as apiClientModule from '../../lib/api';
import * as authStoreModule from '../../stores/authStore';

// apiClient mock
vi.mock('../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// useAuthStore mock
const mockSetAuth = vi.fn();
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: mockSetAuth,
      clearAuth: vi.fn(),
      updateUser: vi.fn(),
    };
    return selector(state);
  }),
}));

// useRouter mock
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

describe('useAuth', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
    Wrapper.displayName = 'TestWrapper';
    return Wrapper;
  };

  describe('useLogin', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      const mockToken = 'test-token';

      (apiClientModule.apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

      await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'password123',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
        '/api/auth/login',
        {
          email: 'test@example.com',
          password: 'password123',
        }
      );
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, mockToken);
    });

    it('should throw error when login fails', async () => {
      (apiClientModule.apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

      await expect(
        result.current.mutateAsync({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다');

      expect(mockSetAuth).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

      await expect(
        result.current.mutateAsync({
          email: 'invalid-email',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('useRegister', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = { id: '1', name: 'New User', email: 'new@example.com' };
      const mockToken = 'test-token';

      (apiClientModule.apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

      await result.current.mutateAsync({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
        '/api/auth/register',
        {
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        }
      );
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, mockToken);
    });

    it('should throw error when registration fails', async () => {
      (apiClientModule.apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Email already exists' },
      });

      const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

      await expect(
        result.current.mutateAsync({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already exists');

      expect(mockSetAuth).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

      await expect(
        result.current.mutateAsync({
          name: '',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });
});

