import prisma from './prisma.js';

/**
 * 활동 로그 인터페이스
 */
export interface ActivityLogData {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 활동 로그를 데이터베이스에 저장합니다.
 * 비동기로 실행되며, 실패해도 요청 처리는 계속됩니다.
 * 
 * @param data - 활동 로그 데이터
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entity: data.entity || null,
        entityId: data.entityId || null,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    // 로그 저장 실패해도 요청은 계속 진행
    console.error('Failed to log activity:', error);
  }
}

