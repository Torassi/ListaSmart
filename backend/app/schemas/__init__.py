"""Schemas Pydantic (contratos de entrada/saída da API)."""
from app.schemas.auth import AuthResponse, LoginInput, SignupInput
from app.schemas.comparison import (
    ComparisonCell,
    ComparisonRow,
    ListComparison,
    MarketTotal,
)
from app.schemas.market import MarketOut
from app.schemas.price import PriceMatrix, PriceOut, RegisterPriceInput
from app.schemas.product import CreateProductInput, ProductOut, ProductWithPrice
from app.schemas.shopping_list import (
    AddItemInput,
    CreateListInput,
    ListItemOut,
    RenameListInput,
    ShoppingListOut,
    UpdateQuantityInput,
)
from app.schemas.user import UpdateProfileInput, UserOut

__all__ = [
    "AuthResponse",
    "LoginInput",
    "SignupInput",
    "UserOut",
    "UpdateProfileInput",
    "ProductOut",
    "ProductWithPrice",
    "CreateProductInput",
    "MarketOut",
    "PriceOut",
    "PriceMatrix",
    "RegisterPriceInput",
    "ShoppingListOut",
    "ListItemOut",
    "AddItemInput",
    "CreateListInput",
    "RenameListInput",
    "UpdateQuantityInput",
    "ListComparison",
    "ComparisonRow",
    "ComparisonCell",
    "MarketTotal",
]
