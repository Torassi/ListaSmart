"""Modelos de inteligência: eventos de busca e snapshots de comparação.

- `SearchEvent`: registra buscas (produto/categoria/termo) para alimentar o
  ranking de produtos/categorias mais pesquisados. Não guarda dados sensíveis.
- `ComparisonSnapshot`: histórico das comparações que o usuário registrou
  explicitamente — base para economia média, economias recentes e
  competitividade dos mercados (histórico confiável, sem efeitos colaterais em
  GETs).
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SearchEvent(Base):
    __tablename__ = "search_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Autoria/contexto são opcionais (busca anônima é válida). FKs com SET NULL
    # para preservar o histórico mesmo se o usuário/produto for removido.
    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    product_id: Mapped[str | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    query: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )


class ComparisonSnapshot(Base):
    __tablename__ = "comparison_snapshots"
    __table_args__ = (
        CheckConstraint("cheapest_total >= 0", name="ck_snapshot_cheapest_total"),
        CheckConstraint(
            "most_expensive_total >= 0", name="ck_snapshot_most_expensive_total"
        ),
        CheckConstraint("saved_amount >= 0", name="ck_snapshot_saved_amount"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # SET NULL para o snapshot sobreviver à exclusão da lista (histórico).
    shopping_list_id: Mapped[str | None] = mapped_column(
        ForeignKey("shopping_lists.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Nome da lista desnormalizado: preserva o rótulo mesmo após excluir a lista.
    list_name: Mapped[str] = mapped_column(String(120), nullable=False)
    cheapest_market_id: Mapped[str | None] = mapped_column(
        ForeignKey("markets.id", ondelete="SET NULL"), nullable=True
    )
    most_expensive_market_id: Mapped[str | None] = mapped_column(
        ForeignKey("markets.id", ondelete="SET NULL"), nullable=True
    )
    cheapest_total: Mapped[float] = mapped_column(Float, nullable=False)
    most_expensive_total: Mapped[float] = mapped_column(Float, nullable=False)
    saved_amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )
