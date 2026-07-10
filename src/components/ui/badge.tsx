import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'accent';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={twMerge(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
        variant === 'default' &&
        'border-transparent bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900',
        variant === 'secondary' &&
        'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
        variant === 'destructive' &&
        'border-transparent bg-red-500/10 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50',
        variant === 'success' &&
        'border-transparent bg-green-500/10 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50',
        variant === 'warning' &&
        'border-transparent bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/50',
        variant === 'accent' &&
        'border-transparent bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50',
        variant === 'outline' && 'text-slate-950 border-slate-200 dark:text-slate-50 dark:border-slate-800',
        className
      )}
      {...props}
    />
  );
}

export { Badge };
