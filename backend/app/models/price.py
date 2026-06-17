"""Modelo de preço de um produto em um supermercado.

Chave composta (product_id, market_id): há no máximo um preço "atual" por
combinação produto/mercado. Registrar um preço manual faz upsert deste registro.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Price(Base):
    __tablename__ = "prices"

    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )
    market_id: Mapped[str] = mapped_column(
        ForeignKey("markets.id", ondelete="CASCADE"), primary_key=True
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="manual")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
