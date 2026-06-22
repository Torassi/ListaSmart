"""Agregação dos indicadores do dashboard de inteligência (dados reais).

Fontes:
- preços (`prices`): contagem de preços manuais e oportunidades de economia;
- eventos de busca (`search_events`): produtos/categorias mais pesquisados;
- snapshots de comparação (`comparison_snapshots`): competitividade dos
  mercados, economia média e mercado campeão do usuário.

Nada é fictício: quando não há dados, as coleções voltam vazias e os números
voltam zerados.
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    ComparisonSnapshot,
    Market,
    Price,
    Product,
    SearchEvent,
    User,
)
from app.schemas.analytics import (
    AnalyticsData,
    CategoryShare,
    MarketCompetitiveness,
    PriceOpportunity,
    RankedProduct,
)
from app.schemas.market import MarketOut
from app.schemas.product import ProductOut

OPPORTUNITIES_LIMIT = 10
RANKING_LIMIT = 10


def _round2(value: float) -> float:
    return round(value + 1e-9, 2)


def build_analytics(db: Session, user: User) -> AnalyticsData:
    markets = db.execute(select(Market)).scalars().all()
    market_name = {m.id: m.name for m in markets}

    manual_prices_count = (
        db.execute(
            select(func.count()).select_from(Price).where(Price.source == "manual")
        ).scalar_one()
    )

    opportunities = _opportunities(db, market_name)
    competitiveness = _market_competitiveness(db, user, markets)
    cheapest_market_by_list = (
        competitiveness[0].market.name
        if competitiveness and competitiveness[0].cheapest_wins > 0
        else "—"
    )
    avg_savings = _avg_savings(db, user)
    category_shares = _category_shares(db)
    most_searched = _most_searched_products(db)

    return AnalyticsData(
        cheapest_market_by_list=cheapest_market_by_list,
        avg_savings_per_user=avg_savings,
        manual_prices_count=manual_prices_count,
        most_searched_products=most_searched,
        category_shares=category_shares,
        market_competitiveness=competitiveness,
        opportunities=opportunities,
    )


def _opportunities(
    db: Session, market_name: dict[str, str]
) -> list[PriceOpportunity]:
    """Produtos com maior diferença entre menor e maior preço entre mercados."""
    matrix: dict[str, dict[str, float]] = {}
    for price in db.execute(select(Price)).scalars().all():
        matrix.setdefault(price.product_id, {})[price.market_id] = price.value

    result: list[tuple[float, PriceOpportunity]] = []
    for product in db.execute(select(Product)).scalars().all():
        by_market = matrix.get(product.id, {})
        if len(by_market) < 2:
            continue
        min_market = min(by_market, key=lambda m: by_market[m])
        max_market = max(by_market, key=lambda m: by_market[m])
        min_price = by_market[min_market]
        max_price = by_market[max_market]
        diff = max_price - min_price
        if diff <= 0:
            continue
        result.append(
            (
                diff,
                PriceOpportunity(
                    product=ProductOut.model_validate(product),
                    cheapest_market=market_name.get(min_market, min_market),
                    most_expensive_market=market_name.get(max_market, max_market),
                    min_price=_round2(min_price),
                    max_price=_round2(max_price),
                    diff=_round2(diff),
                ),
            )
        )

    result.sort(key=lambda x: x[0], reverse=True)
    return [op for _, op in result[:OPPORTUNITIES_LIMIT]]


def _market_competitiveness(
    db: Session, user: User, markets: list[Market]
) -> list[MarketCompetitiveness]:
    """Vitórias (mercado mais barato) por mercado nos snapshots do usuário."""
    rows = db.execute(
        select(ComparisonSnapshot.cheapest_market_id, func.count())
        .where(
            ComparisonSnapshot.user_id == user.id,
            ComparisonSnapshot.cheapest_market_id.is_not(None),
        )
        .group_by(ComparisonSnapshot.cheapest_market_id)
    ).all()
    wins = {market_id: count for market_id, count in rows}

    competitiveness = [
        MarketCompetitiveness(
            market=MarketOut.model_validate(m), cheapest_wins=wins.get(m.id, 0)
        )
        for m in markets
    ]
    competitiveness.sort(key=lambda c: c.cheapest_wins, reverse=True)
    return competitiveness


def _avg_savings(db: Session, user: User) -> float:
    """Média de economia registrada (snapshots) do usuário."""
    avg = db.execute(
        select(func.avg(ComparisonSnapshot.saved_amount)).where(
            ComparisonSnapshot.user_id == user.id
        )
    ).scalar_one_or_none()
    return _round2(avg) if avg is not None else 0.0


def _category_shares(db: Session) -> list[CategoryShare]:
    rows = db.execute(
        select(SearchEvent.category, func.count())
        .where(SearchEvent.category.is_not(None))
        .group_by(SearchEvent.category)
        .order_by(func.count().desc())
    ).all()
    return [CategoryShare(category=cat, searches=count) for cat, count in rows]


def _most_searched_products(db: Session) -> list[RankedProduct]:
    rows = db.execute(
        select(SearchEvent.product_id, func.count())
        .where(SearchEvent.product_id.is_not(None))
        .group_by(SearchEvent.product_id)
        .order_by(func.count().desc())
        .limit(RANKING_LIMIT)
    ).all()

    ranked: list[RankedProduct] = []
    for product_id, count in rows:
        product = db.get(Product, product_id)
        if product is None:
            continue  # produto removido — ignora no ranking
        ranked.append(
            RankedProduct(product=ProductOut.model_validate(product), searches=count)
        )
    return ranked
