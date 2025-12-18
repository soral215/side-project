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

