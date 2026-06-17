"""Schema de supermercado (contrato `Market` do front)."""
from __future__ import annotations

from app.schemas.common import CamelModel


class MarketOut(CamelModel):
    """Espelha `Market` de src/types/index.ts."""

    id: str
    name: str
    brand_color: str | None = None
    logo_url: str | None = None
