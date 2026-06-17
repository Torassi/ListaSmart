"""Schemas de preço (contrato `Price` e `PriceMatrix` do front)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel

PriceSource = Literal["manual", "crowd"]


class PriceOut(CamelModel):
    """Espelha `Price` de src/types/index.ts."""

    product_id: str
    market_id: str
    value: float
    updated_at: datetime
    source: PriceSource


class RegisterPriceInput(CamelModel):
    """Registro manual de preço de um produto em um mercado."""

    product_id: str = Field(min_length=1)
    market_id: str = Field(min_length=1)
    value: float = Field(gt=0, le=100_000, description="Preço em reais.")


# PriceMatrix: productId -> (marketId -> valor). Espelha src/services/list.ts.
PriceMatrix = dict[str, dict[str, float]]
