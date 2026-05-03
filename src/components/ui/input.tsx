import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-12 w-full bg-paper border border-line px-4 py-2 text-[15px] text-ink placeholder:text-muted',
      'focus-visible:outline-none focus-visible:border-ink transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex w-full bg-paper border border-line px-4 py-3 text-[15px] text-ink placeholder:text-muted min-h-[96px]',
      'focus-visible:outline-none focus-visible:border-ink transition-colors',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Label = ({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={cn('block eyebrow mb-2', className)}
  >
    {children}
  </label>
);
