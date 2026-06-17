"""Modelo de supermercado."""
from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Market(Base):
    __tablename__ = "markets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    brand_color: Mapped[str | None] = mapped_column(String(16), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(4096), nullable=True)
