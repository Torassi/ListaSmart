"""Schemas de comparação de preços (contrato `ListComparison` do front)."""
from __future__ import annotations

from app.schemas.common import CamelModel
from app.schemas.market import MarketOut
from app.schemas.product import ProductOut


class ComparisonCell(CamelModel):
    """Espelha `ComparisonCell`. value=None quando o mercado não tem o preço."""

    market_id: str
    value: float | None
    is_cheapest: bool
    is_most_expensive: bool


class ComparisonRow(CamelModel):
    """Espelha `ComparisonRow`."""

    product: ProductOut
    quantity: int
    cells: list[ComparisonCell]


class MarketTotal(CamelModel):
    """Espelha `MarketTotal`."""

    market_id: str
    total: float


class ListComparison(CamelModel):
    """Espelha `ListComparison` de src/types/index.ts."""

    markets: list[MarketOut]
    rows: list[ComparisonRow]
    totals: list[MarketTotal]
    cheapest_market_id: str
    most_expensive_market_id: str
    saved_amount: float
