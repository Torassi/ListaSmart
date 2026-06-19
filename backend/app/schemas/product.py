"""Schemas de produto (contrato `Product` do front)."""
from __future__ import annotations

from typing import Annotated

from pydantic import Field, field_validator

from app.schemas.common import PRODUCT_CATEGORIES, CamelModel


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


class CreateProductInput(CamelModel):
    """Cadastro manual de produto + preço inicial em um mercado.

    Espelha `catalogProductSchema` de src/lib/validation.ts. A validação aqui é
    a fonte de verdade — o cliente apenas melhora a UX.
    """

    name: Annotated[str, Field(min_length=2, max_length=120)]
    category: str = Field(min_length=1, max_length=40)
    unit: Annotated[str, Field(min_length=1, max_length=40)]
    image_url: str | None = Field(default=None, max_length=4096)
    barcode: str | None = Field(default=None, max_length=14)
    market_id: str = Field(min_length=1)
    price: float = Field(gt=0, le=100_000, description="Preço inicial em reais.")

    @field_validator("name", "unit")
    @classmethod
    def _strip_required(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Campo obrigatório.")
        return cleaned

    @field_validator("category")
    @classmethod
    def _validate_category(cls, value: str) -> str:
        cleaned = value.strip()
        if cleaned not in PRODUCT_CATEGORIES:
            raise ValueError("Categoria inválida.")
        return cleaned

    @field_validator("barcode")
    @classmethod
    def _validate_barcode(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if cleaned == "":
            return None
        if not (cleaned.isdigit() and 8 <= len(cleaned) <= 14):
            raise ValueError("Código de barras inválido (use de 8 a 14 dígitos).")
        return cleaned

    @field_validator("image_url")
    @classmethod
    def _validate_image(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if cleaned == "":
            return None
        allowed_prefixes = ("data:image/", "https://", "http://")
        if not cleaned.startswith(allowed_prefixes):
            raise ValueError(
                "Imagem inválida: use uma URL http(s) ou um data URL de imagem."
            )
        return cleaned
