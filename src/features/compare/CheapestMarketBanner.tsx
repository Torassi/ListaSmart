/**
 * CheapestMarketBanner — destaque do mercado mais barato para a lista completa,
 * com o total e a economia frente ao mercado mais caro.
 */
import { Sparkles, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent, savingsRatio } from '@/lib/currency';
import type { ListComparison, Market } from '@/types';

interface CheapestMarketBannerProps {
  comparison: ListComparison;
}

export function CheapestMarketBanner({ comparison }: CheapestMarketBannerProps) {
  const cheapest = comparison.markets.find((m: Market) => m.id === comparison.cheapestMarketId);
  const cheapestTotal = comparison.totals.find((t) => t.marketId === comparison.cheapestMarketId)?.total;
  const mostExpensiveTotal = comparison.totals.find(
    (t) => t.marketId === comparison.mostExpensiveMarketId,
  )?.total;

  if (!cheapest || cheapestTotal == null) return null;

  const ratio = mostExpensiveTotal != null ? savingsRatio(mostExpensiveTotal, cheapestTotal) : 0;

  return (
    <div className="overflow-hidden rounded-lg bg-primary p-6 text-white shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Sugestão: mercado mais barato
          </p>
          <p className="mt-1 text-3xl font-extrabold">{cheapest.name}</p>
          <p className="money mt-1 text-white/90">
            Total da lista: <span className="font-bold">{formatCurrency(cheapestTotal)}</span>
          </p>
        </div>

        {comparison.savedAmount > 0 && (
          <div className="rounded-md bg-white/15 px-5 py-4 text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white/90">
              <TrendingDown className="h-4 w-4" aria-hidden="true" />
              Você economiza
            </p>
            <p className="money mt-1 text-2xl font-extrabold">{formatCurrency(comparison.savedAmount)}</p>
            <p className="text-xs text-white/80">{formatPercent(ratio)} vs. o mais caro</p>
          </div>
        )}
      </div>
    </div>
  );
}
