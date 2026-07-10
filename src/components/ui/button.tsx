import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'accent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={twMerge(
          'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',

          // Variants
          variant === 'default' && 'bg-brand-navy text-white shadow-sm hover:bg-primary-hover active:scale-[0.98]',
          variant === 'destructive' && 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]',
          variant === 'outline' && 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
          variant === 'secondary' && 'bg-brand-red text-white shadow-sm hover:bg-secondary-hover active:scale-[0.98]',
          variant === 'accent' && 'bg-brand-orange text-white shadow-sm hover:bg-accent-hover active:scale-[0.98]',
          variant === 'ghost' && 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
          variant === 'link' && 'text-slate-900 underline-offset-4 hover:underline dark:text-slate-50',

          // Sizes
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 px-3',
          size === 'lg' && 'h-11 rounded-lg px-8',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
