"""Rota de comparação de preços de uma lista entre supermercados (privada)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.errors import NotFoundError
from app.models import Market, Price, ShoppingList, User
from app.schemas import ListComparison
from app.services.comparison import build_comparison

router = APIRouter(prefix="/lists", tags=["comparison"])


@router.get("/{list_id}/comparison", response_model=ListComparison)
def compare_list(
    list_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ListComparison:
    """Compara a lista entre todos os mercados: totais, mais barato/caro e economia."""
    shopping_list = db.get(ShoppingList, list_id)
    if shopping_list is None or shopping_list.owner_id != user.id:
        raise NotFoundError("Lista não encontrada.")

    markets = db.execute(select(Market).order_by(Market.name)).scalars().all()

    matrix: dict[str, dict[str, float]] = {}
    for price in db.execute(select(Price)).scalars().all():
        matrix.setdefault(price.product_id, {})[price.market_id] = price.value

    return build_comparison(shopping_list, markets, matrix)
