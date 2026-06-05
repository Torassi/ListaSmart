/**
 * Badge — rótulo compacto para status/categorias.
 * Tons derivados dos tokens semânticos e de marca.
 */
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-bg text-text-muted',
  primary: 'bg-primary-soft text-primary-active',
  secondary: 'bg-secondary-soft text-secondary-active',
  success: 'bg-primary-soft text-primary-active',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
