"""Rotas de cadastro manual de produtos no catálogo (privadas).

Diferente da leitura do catálogo (pública, em `routers/catalog.py`), criar um
produto exige autenticação. Cada cadastro:

- valida nome, categoria, unidade, código de barras e imagem (ver schema);
- impede código de barras duplicado;
- cria o produto e já registra o preço inicial no mercado selecionado.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.errors import ConflictError, NotFoundError
from app.models import Market, Price, Product, User
from app.schemas import CreateProductInput, ProductWithPrice
from app.schemas.product import ProductOut

router = APIRouter(prefix="/products", tags=["products"])

# Placeholder usado quando o cadastro não envia imagem (SVG offline, igual ao front).
_DEFAULT_IMAGE = (
    "data:image/svg+xml;utf8,"
    "%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22"
    "%20height%3D%22300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20"
    "fill%3D%22%23E9F8F1%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20"
    "dominant-baseline%3D%22central%22%20text-anchor%3D%22middle%22%20"
    "font-size%3D%22140%22%3E%F0%9F%9B%92%3C%2Ftext%3E%3C%2Fsvg%3E"
)


@router.post("", response_model=ProductWithPrice, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: CreateProductInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProductWithPrice:
    """Cadastra um produto no catálogo e seu preço inicial em um mercado."""
    # Mercado precisa existir para registrar o preço inicial.
    if db.get(Market, payload.market_id) is None:
        raise NotFoundError("Supermercado não encontrado.")

    # Impede código de barras duplicado.
    if payload.barcode is not None:
        existing = (
            db.query(Product).filter(Product.barcode == payload.barcode).first()
        )
        if existing is not None:
            raise ConflictError(
                "Já existe um produto com este código de barras.",
                code="barcode_taken",
            )

    product = Product(
        id=f"prod_{uuid.uuid4().hex}",
        name=payload.name,
        category=payload.category,
        unit=payload.unit,
        image_url=payload.image_url or _DEFAULT_IMAGE,
        barcode=payload.barcode,
        created_by=user.id,
    )
    db.add(product)

    # Preço inicial no mercado selecionado.
    db.add(
        Price(
            product_id=product.id,
            market_id=payload.market_id,
            value=payload.price,
            source="manual",
            created_by=user.id,
        )
    )

    db.commit()
    db.refresh(product)

    return ProductWithPrice(
        **ProductOut.model_validate(product).model_dump(by_alias=False),
        lowest_price=payload.price,
    )
