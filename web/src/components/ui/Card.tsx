import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  interactive?: boolean;
  noPad?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  glass = true,
  interactive = false,
  noPad = false,
  children,
  ...props
}) => (
  <div
    className={cn(
      'rounded-[var(--radius-lg)] border border-[var(--color-border)]',
      glass && 'bg-[var(--color-bg-elevated)] backdrop-blur-xl shadow-[var(--shadow-md)]',
      !glass && 'bg-[var(--color-surface)]',
      !noPad && 'p-5',
      interactive && [
        'cursor-pointer transition-all duration-200',
        'hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5',
        'active:translate-y-0 active:shadow-[var(--shadow-md)]',
      ],
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1 mb-4', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('font-heading font-semibold text-[var(--color-fg-1)] tracking-tight', className)} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-[var(--color-fg-2)] leading-relaxed', className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('', className)} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-border)]', className)} {...props} />
);
