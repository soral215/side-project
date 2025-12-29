import React from 'react';
import { Skeleton } from './Skeleton';

export interface SkeletonCardProps {
  /** 카드 내부에 표시할 스켈레톤 요소 */
  showAvatar?: boolean;
  showTitle?: boolean;
  showText?: boolean;
  showButton?: boolean;
  className?: string;
}

/**
 * 카드 스켈레톤
 * 카드 형태의 로딩 상태를 표현합니다.
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  showTitle = true,
  showText = true,
  showButton = false,
  className,
}) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg bg-white ${className || ''}`}>
      <div className="flex items-start gap-4">
        {showAvatar && (
          <Skeleton variant="circular" width={48} height={48} />
        )}
        <div className="flex-1 space-y-3">
          {showTitle && (
            <Skeleton variant="text" width="60%" height={20} />
          )}
          {showText && (
            <>
              <Skeleton variant="text" width="100%" height={16} />
              <Skeleton variant="text" width="80%" height={16} />
            </>
          )}
          {showButton && (
            <div className="flex gap-2 pt-2">
              <Skeleton variant="rectangular" width={80} height={32} />
              <Skeleton variant="rectangular" width={80} height={32} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

