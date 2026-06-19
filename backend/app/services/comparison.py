"""Builder do comparativo de preços de uma lista entre supermercados.

Replica a semântica de `src/lib/comparison.ts` + `src/lib/pricing.ts` do front:

- Cada linha (produto) mostra o preço em cada mercado; o menor e o maior são
  destacados APENAS quando há variação (min < max) naquela linha.
- O total por mercado soma (valor × quantidade) apenas dos itens que têm preço
  naquele mercado (mercados parciais ainda recebem total, mas são marcados como
  cobertura incompleta).
- IMPORTANTE: apenas mercados com COBERTURA COMPLETA (preço para todos os itens
  da lista) podem ser indicados como mais barato/mais caro e entrar no cálculo
  da economia. Um mercado sem alguns preços teria um total artificialmente baixo
  e seria injustamente apontado como "mais barato".
- A economia é a diferença entre o total mais caro e o mais barato (entre
  mercados completos).
"""
from __future__ import annotations

from app.models import Market, ShoppingList
from app.schemas.comparison import (
    ComparisonCell,
    ComparisonRow,
    ListComparison,
    MarketTotal,
)
from app.schemas.market import MarketOut
from app.schemas.product import ProductOut


def _round2(value: float) -> float:
    return round(value + 1e-9, 2)


def build_comparison(
    shopping_list: ShoppingList,
    markets: list[Market],
    price_matrix: dict[str, dict[str, float]],
) -> ListComparison:
    rows: list[ComparisonRow] = []

    for item in shopping_list.items:
        product_id = item.product_id
        raw = [
            (m.id, price_matrix.get(product_id, {}).get(m.id))
            for m in markets
        ]
        values = [v for _, v in raw if v is not None]
        min_v = min(values) if values else None
        max_v = max(values) if values else None
        has_variation = min_v is not None and max_v is not None and min_v < max_v

        cells = [
            ComparisonCell(
                market_id=market_id,
                value=value,
                is_cheapest=bool(has_variation and value == min_v),
                is_most_expensive=bool(has_variation and value == max_v),
            )
            for market_id, value in raw
        ]
        rows.append(
            ComparisonRow(
                product=ProductOut.model_validate(item.product),
                quantity=item.quantity,
                cells=cells,
            )
        )

    item_count = len(shopping_list.items)
    totals: list[MarketTotal] = []
    for m in markets:
        total = 0.0
        covered = 0
        for item in shopping_list.items:
            value = price_matrix.get(item.product_id, {}).get(m.id)
            if value is not None:
                total += value * item.quantity
                covered += 1
        # Cobertura completa: tem preço para todos os itens (lista não vazia).
        complete = item_count > 0 and covered == item_count
        totals.append(
            MarketTotal(market_id=m.id, total=_round2(total), complete=complete)
        )

    # Só mercados com cobertura completa disputam mais barato/mais caro/economia.
    eligible = [t for t in totals if t.complete]
    cheapest = min(eligible, key=lambda t: t.total, default=None)
    most_expensive = max(eligible, key=lambda t: t.total, default=None)

    saved = (
        _round2(most_expensive.total - cheapest.total)
        if cheapest and most_expensive
        else 0.0
    )

    return ListComparison(
        markets=[MarketOut.model_validate(m) for m in markets],
        rows=rows,
        totals=totals,
        cheapest_market_id=cheapest.market_id if cheapest else "",
        most_expensive_market_id=most_expensive.market_id if most_expensive else "",
        saved_amount=saved,
    )
