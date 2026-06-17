"""Base dos schemas: serialização em camelCase para casar com o front-end.

Os tipos do front (`src/types/index.ts`) usam camelCase (ex.: `imageUrl`,
`productId`, `updatedAt`). Aqui geramos esses aliases automaticamente, mantendo
o código Python em snake_case. As respostas são serializadas pelo alias.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Modelo base com aliases camelCase e leitura de atributos ORM."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# Categorias válidas (espelha PRODUCT_CATEGORIES do front).
PRODUCT_CATEGORIES = (
    "Hortifrúti",
    "Açougue",
    "Padaria",
    "Laticínios",
    "Mercearia",
    "Bebidas",
    "Limpeza",
    "Higiene",
    "Congelados",
)
