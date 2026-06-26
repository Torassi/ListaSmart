"""Rotas de cadastro manual de produtos no catálogo (privadas).

Diferente da leitura do catálogo (pública, em `routers/catalog.py`), criar um
produto exige autenticação. Cada cadastro:

- valida nome, categoria, unidade, código de barras e imagem (ver schema);
- **deduplica**: reutiliza o produto já existente em vez de duplicar o catálogo;
- faz upsert do preço no mercado selecionado, sem apagar dados existentes.

Critério de identidade (qual produto é "o mesmo"):

1. Código de barras tem prioridade quando informado.
2. Sem código de barras, `nome + unidade + categoria` normalizados (sem
   diferenciar caixa, espaços extras ou nas extremidades) identificam o produto.
3. Unidades diferentes NÃO são mescladas ("Arroz 1 kg" != "Arroz 5 kg").
4. Conflitos de código de barras retornam erro claro, sem mesclar registros.
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

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


def _norm(text: str) -> str:
    """Normaliza texto para comparação de identidade.

    Remove espaços nas extremidades, colapsa espaços internos repetidos e
    ignora diferenças de caixa — assim "  Arroz  Branco " == "arroz branco".
    """
    return re.sub(r"\s+", " ", text.strip()).casefold()


def _find_by_identity(
    db: Session, *, name: str, unit: str, category: str
) -> Product | None:
    """Acha um produto com mesmo nome + unidade + categoria (normalizados).

    Categoria é validada contra a lista canônica (schema), então filtramos por
    igualdade exata no banco e comparamos nome/unidade já normalizados em Python
    (o SQLite não colapsa espaços internos por conta própria).
    """
    target_name, target_unit = _norm(name), _norm(unit)
    for product in db.query(Product).filter(Product.category == category).all():
        if _norm(product.name) == target_name and _norm(product.unit) == target_unit:
            return product
    return None


def _resolve_product(
    db: Session, payload: CreateProductInput, *, created_by: str
) -> Product:
    """Reutiliza um produto existente ou cria um novo conforme o critério de identidade.

    Levanta `ConflictError` quando o código de barras informado conflita com um
    registro existente, evitando mesclar produtos diferentes por engano.
    """
    by_identity = _find_by_identity(
        db, name=payload.name, unit=payload.unit, category=payload.category
    )

    if payload.barcode is not None:
        by_barcode = (
            db.query(Product).filter(Product.barcode == payload.barcode).first()
        )
        if by_barcode is not None:
            # O código de barras já pertence a um produto. Só é "o mesmo" se a
            # identidade (nome+unidade+categoria) também bater; caso contrário é
            # conflito — o código está em uso por outro produto.
            if by_identity is not None and by_identity.id == by_barcode.id:
                return by_barcode
            raise ConflictError(
                "Já existe um produto com este código de barras.",
                code="barcode_taken",
            )

        if by_identity is not None:
            # Mesmo produto por nome/unidade/categoria, mas com código de barras
            # divergente: não mesclamos para não corromper o catálogo.
            if by_identity.barcode is not None:
                raise ConflictError(
                    "Este produto já está cadastrado com outro código de barras.",
                    code="barcode_conflict",
                )
            # Produto sem código ainda: completa o cadastro com o código informado.
            by_identity.barcode = payload.barcode
            return by_identity

        return _new_product(db, payload, created_by=created_by)

    # Sem código de barras: identidade textual é o único critério.
    if by_identity is not None:
        return by_identity
    return _new_product(db, payload, created_by=created_by)


def _new_product(
    db: Session, payload: CreateProductInput, *, created_by: str
) -> Product:
    """Cria e insere um novo produto no catálogo (flush para liberar o id às FKs)."""
    product = Product(
        id=f"prod_{uuid.uuid4().hex}",
        name=payload.name,
        category=payload.category,
        unit=payload.unit,
        image_url=payload.image_url or _DEFAULT_IMAGE,
        barcode=payload.barcode,
        created_by=created_by,
    )
    db.add(product)
    # FKs habilitadas: insere o produto antes do preço que o referencia.
    db.flush()
    return product


@router.post("", response_model=ProductWithPrice, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: CreateProductInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProductWithPrice:
    """Cadastra/atualiza um produto no catálogo e faz upsert do preço no mercado.

    - Reutiliza o produto existente (por código de barras ou por
      nome+unidade+categoria) em vez de duplicar o catálogo.
    - Faz upsert do preço na chave composta (product_id, market_id).
    - Responde com o id (reutilizado ou criado) e o menor preço entre os mercados.
    """
    # Mercado precisa existir para registrar o preço.
    if db.get(Market, payload.market_id) is None:
        raise NotFoundError("Supermercado não encontrado.")

    product = _resolve_product(db, payload, created_by=user.id)

    # Upsert do preço no mercado selecionado (mesma regra do POST /prices).
    price = db.get(Price, (product.id, payload.market_id))
    if price is None:
        db.add(
            Price(
                product_id=product.id,
                market_id=payload.market_id,
                value=payload.price,
                source="manual",
                created_by=user.id,
            )
        )
    else:
        price.value = payload.price
        price.source = "manual"
        price.created_by = user.id
        price.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(product)

    # Menor preço atual entre todos os mercados deste produto.
    values = [
        p.value
        for p in db.query(Price).filter(Price.product_id == product.id).all()
    ]
    lowest_price = min(values) if values else payload.price

    return ProductWithPrice(
        **ProductOut.model_validate(product).model_dump(by_alias=False),
        lowest_price=lowest_price,
    )
