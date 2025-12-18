// 공통 유틸리티 함수

/**
 * API 응답 래퍼 함수
 */
export function createApiResponse<T>(
  data: T,
  success = true
): { success: boolean; data: T } {
  return { success, data };
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  message: string,
  code?: string
): { success: false; error: { message: string; code?: string } } {
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
}

/**
 * 날짜 포맷팅
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Zod 검증 에러를 API 응답 형식으로 변환
 */
export function formatZodError(zodError: { errors: Array<{ path: (string | number)[]; message: string }> }): {
  success: false;
  error: {
    message: string;
    code: string;
    details: Array<{ field: string; message: string }>;
  };
} {
  return {
    success: false,
    error: {
      message: '입력 검증에 실패했습니다',
      code: 'VALIDATION_ERROR',
      details: zodError.errors.map((err) => ({
        field: err.path.length > 0 ? err.path.join('.') : 'root',
        message: err.message,
      })),
    },
  };
}

