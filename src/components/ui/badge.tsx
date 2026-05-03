import { cn } from '@/lib/utils';

export function Badge({
  children,
  className,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
}) {
  const variants = {
    default: 'bg-ink text-canvas',
    outline: 'border border-line text-ink',
    success: 'bg-[#0f5132] text-white',
    warning: 'bg-[#664d03] text-white',
    error: 'bg-accent text-white',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.14em]',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
