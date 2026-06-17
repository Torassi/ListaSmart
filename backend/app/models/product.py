"""Modelo de produto do catálogo."""
from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


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
    barcode: Mapped[str | None] = mapped_column(String(14), index=True, nullable=True)
