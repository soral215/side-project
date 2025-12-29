import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 스켈레톤의 너비 */
  width?: string | number;
  /** 스켈레톤의 높이 */
  height?: string | number;
  /** 원형 스켈레톤 (아바타 등에 사용) */
  circle?: boolean;
  /** 애니메이션 활성화 여부 */
  animate?: boolean;
  /** 변형 타입 */
  variant?: 'text' | 'rectangular' | 'circular';
}

/**
 * Skeleton 컴포넌트
 * 로딩 상태를 시각적으로 표현하는 스켈레톤 UI입니다.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      width,
      height,
      circle = false,
      animate = true,
      variant,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // variant에 따라 기본 스타일 결정
    const getVariantStyles = () => {
      if (variant === 'circular' || circle) {
        return 'rounded-full';
      }
      if (variant === 'text') {
        return 'rounded';
      }
      return 'rounded';
    };

    const skeletonStyle: React.CSSProperties = {
      width: width || (variant === 'text' ? '100%' : undefined),
      height: height || (variant === 'text' ? '1em' : undefined),
      ...style,
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'bg-gray-200',
          getVariantStyles(),
          animate && 'animate-pulse',
          className
        )}
        style={skeletonStyle}
        aria-busy="true"
        aria-label="로딩 중"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

