"""Schemas de inteligência: analytics, eventos de busca, snapshots e economia.

Espelham os tipos do front (`AnalyticsData`, `RankedProduct`, `CategoryShare`,
`MarketCompetitiveness`, `PriceOpportunity`, `SavingsSummary`). Respostas em
camelCase via `CamelModel`.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import Field, field_validator

from app.schemas.common import CamelModel
from app.schemas.market import MarketOut
from app.schemas.product import ProductOut


class RankedProduct(CamelModel):
    product: ProductOut
    searches: int


class CategoryShare(CamelModel):
    category: str
    searches: int


class MarketCompetitiveness(CamelModel):
    market: MarketOut
    cheapest_wins: int


class PriceOpportunity(CamelModel):
    product: ProductOut
    cheapest_market: str
    most_expensive_market: str
    min_price: float
    max_price: float
    diff: float


class AnalyticsData(CamelModel):
    """Espelha `AnalyticsData` de src/types/index.ts."""

    cheapest_market_by_list: str
    avg_savings_per_user: float
    manual_prices_count: int
    most_searched_products: list[RankedProduct]
    category_shares: list[CategoryShare]
    market_competitiveness: list[MarketCompetitiveness]
    opportunities: list[PriceOpportunity]


class SearchEventInput(CamelModel):
    """Registro de um evento de busca. Tudo opcional, mas exige algum conteúdo.

    Não armazena dados sensíveis — apenas produto/categoria/termo de busca.
    """

    product_id: str | None = Field(default=None, max_length=64)
    category: str | None = Field(default=None, max_length=40)
    query: str | None = Field(default=None, max_length=80)

    @field_validator("query")
    @classmethod
    def _clean_query(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ComparisonSnapshotOut(CamelModel):
    """Snapshot de comparação registrado pelo usuário."""

    id: int
    shopping_list_id: str | None
    list_name: str
    cheapest_market_id: str | None
    most_expensive_market_id: str | None
    cheapest_total: float
    most_expensive_total: float
    saved_amount: float
    created_at: datetime


class SavingsSummary(CamelModel):
    """Espelha `SavingsSummary` de src/types/index.ts (economias recentes)."""

    id: str
    list_name: str
    cheapest_market: str
    total: float
    saved_amount: float
    date: datetime
