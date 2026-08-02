import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, iconRight, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-fg-2)] uppercase tracking-widest"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-[var(--color-fg-3)] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 px-3 text-sm',
              'bg-[var(--color-surface-md)] border border-[var(--color-border)]',
              'rounded-[var(--radius-md)] text-[var(--color-fg-1)]',
              'placeholder:text-[var(--color-fg-3)]',
              'transition-all duration-200',
              'focus:outline-none focus:border-[var(--color-border-focus)]',
              'focus:bg-[rgba(139,92,246,0.05)]',
              'focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]',
              error && 'border-[var(--color-destructive)] focus:border-[var(--color-destructive)]',
              icon && 'pl-9',
              iconRight && 'pr-9',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 text-[var(--color-fg-3)] flex items-center">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-[var(--color-destructive)] mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
