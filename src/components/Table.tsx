/**
 * Table — tabela genérica e tipada do Design System.
 *
 * Recebe `columns` (definição) e `data`. Cada coluna pode renderizar conteúdo
 * customizado via `cell`. Usada no comparador e no analytics.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Conteúdo da célula; recebe a linha e o índice. */
  cell: (row: T, index: number) => ReactNode;
  /** Alinhamento do conteúdo. */
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Extrai uma key estável por linha. */
  rowKey: (row: T, index: number) => string;
  caption?: string;
  emptyMessage?: string;
  className?: string;
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export function Table<T>({
  columns,
  data,
  rowKey,
  caption,
  emptyMessage = 'Nenhum registro encontrado.',
  className,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-subtle',
                  alignClass[col.align ?? 'left'],
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-subtle">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={rowKey(row, index)} className="border-b border-border last:border-0 hover:bg-bg">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-text', alignClass[col.align ?? 'left'], col.className)}
                  >
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
