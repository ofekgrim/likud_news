import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant === 'default' && 'bg-[#0099DB] text-white',
        variant === 'secondary' && 'bg-blue-50 text-blue-700 border border-blue-200',
        variant === 'success' && 'bg-green-50 text-green-700 border border-green-200',
        variant === 'warning' && 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        variant === 'destructive' && 'bg-red-50 text-red-700 border border-red-200',
        variant === 'outline' && 'border border-gray-300 text-gray-700',
        className
      )}
      {...props}
    />
  );
}
