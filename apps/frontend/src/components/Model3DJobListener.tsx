'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useModel3DJobStore, type Model3DJob } from '../stores/model3dJobStore';

type JobEventPayload = { job: Model3DJob };

const getApiUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://side-projectbackend-production-1e9c.up.railway.app';
  return url.replace(/\/$/, '');
};

/**
 * 3D Job 상태를 전역으로 수신하는 리스너
 * - 어떤 페이지에 있든 Meshy(또는 기타 provider) 작업 상태 업데이트를 받을 수 있습니다.
 */
export const Model3DJobListener = () => {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const upsertJob = useModel3DJobStore((s) => s.upsertJob);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket: Socket = io(getApiUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 3D Job 소켓 연결됨:', socket.id);
      }
    });

    socket.on('connect_error', (err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 3D Job 소켓 연결 실패:', err?.message || err);
      }
    });

    socket.on('model3d:job', (payload: JobEventPayload) => {
      if (payload?.job?.id) {
        upsertJob(payload.job);
      }
    });

    return () => {
      socket.close();
    };
  }, [isAuthenticated, token, upsertJob]);

  return null;
};


