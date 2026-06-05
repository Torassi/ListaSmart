/**
 * Input + Field — campos de formulário do Design System.
 *
 * - `Input`: input estilizado com estados default/focus(ring)/erro/disabled.
 * - `Field`: wrapper acessível com <label>, descrição opcional e mensagem de erro
 *   ligada via aria-describedby / aria-invalid.
 *
 * Pensado para uso com react-hook-form (aceita ref e props nativas).
 */
import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn('input-base', hasError && 'border-danger focus:border-danger focus:ring-danger/40', className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, hasError, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn('input-base', hasError && 'border-danger focus:border-danger focus:ring-danger/40', className)}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
  );
});

export interface FieldProps {
  label: string;
  /** id do controle interno; ligações de acessibilidade derivam dele. */
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** Recebe ids de acessibilidade para repassar ao controle (id/aria-describedby). */
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

/**
 * Field é "render prop": ele cria os ids e os repassa ao controle filho,
 * garantindo label/erro/hint corretamente associados (acessibilidade).
 */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>

      {children({ id, describedBy })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
