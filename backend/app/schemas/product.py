"""Schemas de produto (contrato `Product` do front)."""
from __future__ import annotations

from app.schemas.common import CamelModel


class ProductOut(CamelModel):
    """Espelha `Product` de src/types/index.ts."""

    id: str
    name: str
    category: str
    image_url: str
    unit: str
    brand: str | None = None
    barcode: str | None = None


class ProductWithPrice(ProductOut):
    """`Product` + menor preço entre os mercados (usado na listagem do catálogo).

    Espelha `ProductWithPrice` de src/services/catalog.ts.
    """

    lowest_price: float | None = None
