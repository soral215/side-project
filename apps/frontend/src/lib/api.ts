import { type ApiResponse } from '@side-project/shared';

// API URL 설정 - 절대 URL 보장 및 슬래시 제거
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://side-projectbackend-production-1e9c.up.railway.app';
  // 슬래시 제거
  const cleanUrl = url.replace(/\/$/, '');
  // 절대 URL인지 확인 (http:// 또는 https://로 시작)
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    console.error('API_URL must be an absolute URL starting with http:// or https://');
    return 'https://side-projectbackend-production-1e9c.up.railway.app';
  }
  return cleanUrl;
};

const API_URL = getApiUrl();

// API 클라이언트 헬퍼
export const apiClient = {
  get: async <T>(endpoint: string, token?: string | null): Promise<ApiResponse<T>> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return response.json();
  },

  post: async <T>(
    endpoint: string,
    data?: unknown,
    token?: string | null
  ): Promise<ApiResponse<T>> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  },

  put: async <T>(
    endpoint: string,
    data?: unknown,
    token?: string | null
  ): Promise<ApiResponse<T>> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  },

  delete: async <T>(endpoint: string, token?: string | null, body?: unknown): Promise<ApiResponse<T>> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return response.json();
  },

  upload: async <T>(
    endpoint: string,
    file: File,
    token?: string | null
  ): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append('image', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return response.json();
  },
};

// 헬스체크
export const checkHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};
