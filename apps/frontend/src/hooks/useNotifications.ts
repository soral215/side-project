import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../contexts/ToastContext';
import { useFeatureFlag } from '../contexts/FeatureFlagContext';

export interface Notification {
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'profile_updated' | 'system';
  message: string;
  data?: {
    userId?: string;
    name?: string;
    email?: string;
    [key: string]: any;
  };
  timestamp: string;
}

/**
 * 실시간 알림을 관리하는 훅
 * Socket.io를 통해 서버로부터 알림을 수신하고 Toast로 표시합니다.
 */
export const useNotifications = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuthStore();
  const { showInfo, showSuccess, showWarning } = useToast();
  const { isEnabled } = useFeatureFlag();

  // Feature Flag 체크
  const notificationsEnabled = isEnabled('realtimeNotifications');

  useEffect(() => {
    // Feature Flag가 비활성화되어 있거나 토큰이 없으면 연결하지 않음
    if (!notificationsEnabled || !token) {
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://side-projectbackend-production-1e9c.up.railway.app';
    const cleanUrl = API_URL.replace(/\/$/, '');

    // Socket.io 클라이언트 생성
    const newSocket = io(cleanUrl, {
      auth: {
        token, // JWT 토큰 전달
      },
      transports: ['websocket', 'polling'],
    });

    // 연결 성공
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', newSocket.id);
    });

    // 연결 해제
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // 연결 에러
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // 알림 수신
    newSocket.on('notification', (notification: Notification) => {
      console.log('Notification received:', notification);
      
      // 알림 목록에 추가
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // 최대 50개 유지

      // Toast로 표시
      const getToastType = () => {
        switch (notification.type) {
          case 'user_created':
            return 'success';
          case 'user_updated':
            return 'info';
          case 'user_deleted':
            return 'warning';
          case 'profile_updated':
            return 'info';
          default:
            return 'info';
        }
      };

      const toastType = getToastType();
      if (toastType === 'success') {
        showSuccess(notification.message);
      } else if (notification.type === 'user_deleted') {
        // user_deleted는 warning으로 표시
        showWarning(notification.message);
      } else {
        showInfo(notification.message);
      }
    });

    setSocket(newSocket);

    // cleanup
    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, notificationsEnabled, showInfo, showSuccess, showWarning]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    notifications,
    isConnected,
    clearNotifications,
  };
};

