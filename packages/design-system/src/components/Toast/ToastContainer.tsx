import React from 'react';
import { clsx } from 'clsx';
import { Toast, type ToastType } from './Toast';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className={clsx(
        'fixed z-[9999] flex flex-col gap-2',
        positionStyles[position],
        position.includes('center') && 'items-center',
        !position.includes('center') && 'items-end'
      )}
      aria-live="polite"
      aria-label="알림 메시지"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

