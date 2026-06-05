/**
 * SavingsCards — lista de economias recentes do usuário.
 */
import { TrendingDown } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, CardTitle } from '@/components';
import { formatCurrency } from '@/lib/currency';
import type { SavingsSummary } from '@/types';

interface SavingsCardsProps {
  savings: SavingsSummary[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

export function SavingsCards({ savings, isLoading }: SavingsCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Economias recentes</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {isLoading && <p className="text-sm text-text-subtle">Carregando...</p>}

        {!isLoading && savings.length === 0 && (
          <p className="text-sm text-text-subtle">Você ainda não registrou economias.</p>
        )}

        {!isLoading &&
          savings.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{s.listName}</p>
                <p className="text-xs text-text-subtle">
                  {formatDate(s.date)} · mais barato no {s.cheapestMarket}
                </p>
              </div>
              <div className="text-right">
                <Badge tone="success" className="mb-1">
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />-{formatCurrency(s.savedAmount)}
                </Badge>
                <p className="money text-xs text-text-muted">total {formatCurrency(s.total)}</p>
              </div>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
