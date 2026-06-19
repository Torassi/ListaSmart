"""Modelo de preço de um produto em um supermercado.

Chave composta (product_id, market_id): há no máximo um preço "atual" por
combinação produto/mercado. Registrar um preço manual faz upsert deste registro.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Price(Base):
    __tablename__ = "prices"
    __table_args__ = (
        # Validação de valor monetário no banco: preço deve ser positivo.
        CheckConstraint("value > 0", name="ck_price_value_positive"),
    )

    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )
    market_id: Mapped[str] = mapped_column(
        ForeignKey("markets.id", ondelete="CASCADE"), primary_key=True
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="manual")
    # Quem registrou o preço (NULL para preços do seed/crowd).
    created_by: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
