"""Schemas de lista de compras (contratos `ShoppingList` e `ListItem`)."""
from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel
from app.schemas.product import ProductOut
from app.schemas.user import UserOut


class ListItemOut(CamelModel):
    """Espelha `ListItem` de src/types/index.ts."""

    product: ProductOut
    quantity: int


class ShoppingListOut(CamelModel):
    """Espelha `ShoppingList` de src/types/index.ts."""

    id: str
    name: str
    items: list[ListItemOut]
    collaborators: list[UserOut]
    finalized: bool = False
    created_at: datetime
    updated_at: datetime


class CreateListInput(CamelModel):
    name: str = Field(min_length=1, max_length=120)


class RenameListInput(CamelModel):
    name: str = Field(min_length=1, max_length=120)


class AddItemInput(CamelModel):
    product_id: str = Field(min_length=1)
    quantity: int = Field(default=1, ge=1, le=999)


class UpdateQuantityInput(CamelModel):
    quantity: int = Field(ge=1, le=999)
