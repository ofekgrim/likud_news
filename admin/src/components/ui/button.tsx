'use client';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'secondary';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0099DB]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-[#0099DB] text-white hover:bg-[#0088c4]',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
          variant === 'outline' && 'border border-gray-300 bg-white hover:bg-gray-50',
          variant === 'ghost' && 'hover:bg-gray-100',
          variant === 'link' && 'text-[#0099DB] underline-offset-4 hover:underline',
          variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          size === 'sm' && 'h-9 px-3 text-sm',
          size === 'default' && 'h-10 px-4 py-2',
          size === 'lg' && 'h-11 px-8',
          size === 'icon' && 'h-9 w-9 p-0',
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
