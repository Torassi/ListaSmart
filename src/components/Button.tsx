/**
 * Button — botão do Design System.
 *
 * Variantes: primary | secondary | ghost | danger
 * Tamanhos: sm | md | lg
 * Estados: default, hover, active, disabled, loading.
 *
 * Estilos derivados dos tokens do Tailwind (cores/raios/sombras) — sem valores mágicos.
 */
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Ícone exibido antes do conteúdo. */
  leftIcon?: ReactNode;
  /** Ícone exibido depois do conteúdo. */
  rightIcon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all ' +
  'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-card hover:bg-primary-hover hover:shadow-card-hover active:bg-primary-active',
  secondary: 'bg-secondary text-white shadow-card hover:bg-secondary-hover hover:shadow-card-hover active:bg-secondary-active',
  accent: 'bg-accent text-white shadow-card hover:bg-accent-hover hover:shadow-card-hover active:bg-accent-active',
  ghost: 'bg-transparent text-text-muted hover:bg-bg active:bg-border',
  danger: 'bg-danger text-white shadow-card hover:brightness-95 active:brightness-90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});
