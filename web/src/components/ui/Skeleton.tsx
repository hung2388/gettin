import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, width, height, ...props }) => (
  <div
    className={cn('skeleton rounded-[var(--radius-md)]', className)}
    style={{ width, height }}
    aria-hidden="true"
    {...props}
  />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('glass p-5 flex flex-col gap-3', className)}>
    <Skeleton height="20px" width="60%" />
    <Skeleton height="14px" width="90%" />
    <Skeleton height="14px" width="75%" />
    <div className="flex gap-2 mt-2">
      <Skeleton height="32px" width="80px" />
      <Skeleton height="32px" width="80px" />
    </div>
  </div>
);
