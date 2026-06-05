/**
 * KpiCard — cartão de métrica para dashboards (Home e Analytics).
 * Mostra rótulo, valor em destaque (tabular-nums quando monetário), ícone e
 * variação opcional (delta) com tom positivo/negativo.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

export interface KpiCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  /** Texto auxiliar (ex.: "vs. mês anterior"). */
  helpText?: string;
  /** Variação; positivo = verde, negativo = vermelho. */
  deltaLabel?: string;
  deltaPositive?: boolean;
  /** Aplica largura tabular ao valor (use em valores monetários/numéricos). */
  numeric?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  helpText,
  deltaLabel,
  deltaPositive = true,
  numeric = true,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-muted">{label}</p>
        {icon && (
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary-active">
            {icon}
          </span>
        )}
      </div>

      <p className={cn('mt-2 text-2xl font-extrabold text-text', numeric && 'money')}>{value}</p>

      <div className="mt-1 flex items-center gap-2">
        {deltaLabel && (
          <span
            className={cn(
              'text-xs font-semibold',
              deltaPositive ? 'text-primary-active' : 'text-danger',
            )}
          >
            {deltaLabel}
          </span>
        )}
        {helpText && <span className="text-xs text-text-subtle">{helpText}</span>}
      </div>
    </Card>
  );
}
