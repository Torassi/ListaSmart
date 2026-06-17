"""Rotas de preços: registro manual e consulta da matriz de preços.

Leitura da matriz é pública; registrar preço manual exige autenticação.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.errors import NotFoundError
from app.models import Market, Price, Product, User
from app.schemas import PriceMatrix, PriceOut, RegisterPriceInput

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/matrix", response_model=PriceMatrix)
def get_price_matrix(
    db: Session = Depends(get_db),
    product_id: str | None = Query(default=None, alias="productId"),
    market_id: str | None = Query(default=None, alias="marketId"),
) -> PriceMatrix:
    """Matriz productId -> (marketId -> valor). Filtros opcionais."""
    stmt = select(Price)
    if product_id:
        stmt = stmt.where(Price.product_id == product_id)
    if market_id:
        stmt = stmt.where(Price.market_id == market_id)

    matrix: PriceMatrix = {}
    for price in db.execute(stmt).scalars().all():
        matrix.setdefault(price.product_id, {})[price.market_id] = price.value
    return matrix


@router.post("", response_model=PriceOut, status_code=201)
def register_price(
    payload: RegisterPriceInput,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> Price:
    """Registra (ou atualiza) o preço manual de um produto em um mercado."""
    if db.get(Product, payload.product_id) is None:
        raise NotFoundError("Produto não encontrado.")
    if db.get(Market, payload.market_id) is None:
        raise NotFoundError("Supermercado não encontrado.")

    price = db.get(Price, (payload.product_id, payload.market_id))
    if price is None:
        price = Price(
            product_id=payload.product_id,
            market_id=payload.market_id,
            value=payload.value,
            source="manual",
        )
        db.add(price)
    else:
        price.value = payload.value
        price.source = "manual"
        price.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(price)
    return price
