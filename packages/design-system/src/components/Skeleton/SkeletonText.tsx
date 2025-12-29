import React from 'react';
import { clsx } from 'clsx';
import { Skeleton, type SkeletonProps } from './Skeleton';

export interface SkeletonTextProps extends Omit<SkeletonProps, 'variant'> {
  /** 텍스트 라인 수 */
  lines?: number;
  /** 마지막 라인의 너비 (퍼센트) */
  lastLineWidth?: string;
}

/**
 * 텍스트 스켈레톤
 * 여러 줄의 텍스트 로딩 상태를 표현합니다.
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
  className,
  ...props
}) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={clsx(
            'mb-2',
            index === lines - 1 && `w-[${lastLineWidth}]`
          )}
          style={
            index === lines - 1
              ? { width: lastLineWidth }
              : undefined
          }
          {...props}
        />
      ))}
    </div>
  );
};

