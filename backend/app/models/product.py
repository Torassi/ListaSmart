"""Modelo de produto do catálogo."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    # Id em string para casar com o contrato do front (Id = string) e com os
    # ids determinísticos do catálogo mockado (ex.: "p1").
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    image_url: Mapped[str] = mapped_column(String(4096), nullable=False, default="")
    unit: Mapped[str] = mapped_column(String(40), nullable=False, default="unidade")
    brand: Mapped[str | None] = mapped_column(String(80), nullable=True)
    # Código de barras (EAN) opcional, mas ÚNICO quando informado. No SQLite um
    # índice único permite múltiplos NULL, então produtos sem código convivem.
    barcode: Mapped[str | None] = mapped_column(
        String(14), unique=True, index=True, nullable=True
    )
    # Quem cadastrou (cadastro manual). Catálogo seed fica sem autor (NULL).
    created_by: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
