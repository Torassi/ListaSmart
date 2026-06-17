"""Rotas do catálogo: produtos, categorias, mercados e busca de produto.

Catálogo é público (leitura). A busca aceita filtro por nome, categoria e/ou
código de barras.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import NotFoundError
from app.models import Price, Product, Market
from app.schemas import MarketOut, ProductOut, ProductWithPrice

router = APIRouter(tags=["catalog"])


def _lowest_prices(db: Session) -> dict[str, float]:
    """Menor preço de cada produto entre todos os mercados."""
    rows = db.execute(
        select(Price.product_id, func.min(Price.value)).group_by(Price.product_id)
    ).all()
    return {product_id: value for product_id, value in rows}


@router.get("/products", response_model=list[ProductWithPrice])
def list_products(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, max_length=80, description="Busca por nome."),
    category: str | None = Query(default=None, max_length=40),
    barcode: str | None = Query(default=None, max_length=14),
) -> list[ProductWithPrice]:
    """Lista o catálogo. Sem filtros, retorna tudo; com filtros, faz a busca."""
    stmt = select(Product)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q.strip()}%"))
    if category:
        stmt = stmt.where(Product.category == category.strip())
    if barcode:
        stmt = stmt.where(Product.barcode == barcode.strip())
    stmt = stmt.order_by(Product.name)

    products = db.execute(stmt).scalars().all()
    lowest = _lowest_prices(db)

    return [
        ProductWithPrice(
            **ProductOut.model_validate(p).model_dump(by_alias=False),
            lowest_price=lowest.get(p.id),
        )
        for p in products
    ]


@router.get("/products/{product_id}", response_model=ProductWithPrice)
def get_product(product_id: str, db: Session = Depends(get_db)) -> ProductWithPrice:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError("Produto não encontrado.")
    lowest = _lowest_prices(db)
    return ProductWithPrice(
        **ProductOut.model_validate(product).model_dump(by_alias=False),
        lowest_price=lowest.get(product.id),
    )


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)) -> list[str]:
    rows = db.execute(select(Product.category).distinct()).scalars().all()
    return sorted(rows, key=str.casefold)


@router.get("/markets", response_model=list[MarketOut])
def list_markets(db: Session = Depends(get_db)) -> list[Market]:
    return db.execute(select(Market).order_by(Market.name)).scalars().all()
