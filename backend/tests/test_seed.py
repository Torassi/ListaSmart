"""Testes do seed do catálogo real (produtos da pasta `img/`, imagens locais).

Cobrem: mapeamento imagem↔produto, ausência de produtos fictícios, ausência de
duplicatas, preços nos 4 mercados (mesmo product_id, positivos e com 2 casas),
idempotência, purga dos legados sem órfãos e integridade de chaves estrangeiras.
"""
from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production-0123456789")

from app.database import Base
from app.models import ListItem, Market, Price, Product, ShoppingList, User
from app.seed import (
    IMAGE_PREFIX,
    MARKETS,
    ORIGINAL_IMAGE_FILES,
    PRODUCTS,
    apply_seed,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
IMG_DIR = REPO_ROOT / "img"
PUBLIC_DIR = REPO_ROOT / "public" / "images" / "products"
MARKET_IDS = {mid for mid, _name, _color in MARKETS}


@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Banco SQLite em memória isolado, com schema criado via metadata."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def _seed(db: Session) -> dict[str, int]:
    stats = apply_seed(db)
    db.commit()
    return stats


# --------------------------------------------------------------------------- #
# Imagens ↔ produtos
# --------------------------------------------------------------------------- #
def test_every_img_file_has_a_product() -> None:
    """(1) Todo arquivo válido da pasta `img/` possui um produto correspondente."""
    files_on_disk = {f.name for f in IMG_DIR.iterdir() if f.is_file()}
    assert files_on_disk, "pasta img/ não encontrada ou vazia"
    # Cada imagem da pasta está mapeada para um produto…
    assert files_on_disk == ORIGINAL_IMAGE_FILES
    # …e cada produto referencia um arquivo original existente.
    assert len(PRODUCTS) == len(files_on_disk)


def test_each_product_points_to_existing_local_image(db: Session) -> None:
    """(2) Cada produto usa a imagem local correta (existe em public/ e é /images/...)."""
    _seed(db)
    for product in db.query(Product).all():
        assert product.image_url.startswith(IMAGE_PREFIX)
        filename = product.image_url[len(IMAGE_PREFIX) :]
        assert (PUBLIC_DIR / filename).is_file(), f"imagem ausente: {filename}"
        # Não usa imagens externas (somente assets locais).
        assert not product.image_url.startswith(("http://", "https://", "data:"))


# --------------------------------------------------------------------------- #
# Catálogo final
# --------------------------------------------------------------------------- #
def test_no_legacy_fictional_products(db: Session) -> None:
    """(3) Não restam produtos fictícios antigos (ids p1..p20) no catálogo."""
    _seed(db)
    ids = {p.id for p in db.query(Product).all()}
    assert ids == {p["id"] for p in PRODUCTS}
    assert not any(pid.startswith("p") and pid[1:].isdigit() for pid in ids)


def test_no_duplicate_products(db: Session) -> None:
    """(4) Cada produto existe uma única vez (id e identidade nome+marca+unidade)."""
    _seed(db)
    products = db.query(Product).all()
    ids = [p.id for p in products]
    assert len(ids) == len(set(ids))
    identities = [(p.name, p.brand, p.unit) for p in products]
    assert len(identities) == len(set(identities))


# --------------------------------------------------------------------------- #
# Preços por mercado
# --------------------------------------------------------------------------- #
def test_each_product_has_four_market_prices(db: Session) -> None:
    """(5)(6) Cada produto tem preço nos 4 mercados, todos com o mesmo product_id."""
    _seed(db)
    for product in db.query(Product).all():
        prices = db.query(Price).filter(Price.product_id == product.id).all()
        assert {pr.market_id for pr in prices} == MARKET_IDS
        assert all(pr.product_id == product.id for pr in prices)


def test_prices_are_positive_two_decimals(db: Session) -> None:
    """(7) Preços positivos e com no máximo 2 casas decimais."""
    _seed(db)
    for pr in db.query(Price).all():
        assert pr.value > 0
        assert round(pr.value, 2) == pr.value


def test_cheapest_market_is_distributed() -> None:
    """A distribuição do mais barato é realista (não é sempre o mesmo mercado)."""
    winners = {min(p["prices"], key=p["prices"].get) for p in PRODUCTS}
    assert len(winners) >= 3  # vários mercados vencem em ao menos um produto


# --------------------------------------------------------------------------- #
# Idempotência e purga de legados
# --------------------------------------------------------------------------- #
def test_seed_is_idempotent(db: Session) -> None:
    """(8) Rodar o seed duas vezes não duplica produtos nem preços."""
    _seed(db)
    first_products = db.query(Product).count()
    first_prices = db.query(Price).count()
    _seed(db)
    assert db.query(Product).count() == first_products == len(PRODUCTS)
    assert db.query(Price).count() == first_prices == len(PRODUCTS) * len(MARKET_IDS)


def test_seed_purges_legacy_without_orphaning_lists(db: Session) -> None:
    """Produtos fictícios legados (e seus preços/itens) são removidos; a lista fica."""
    user = User(name="U", email="u@x.com", password_hash="x")
    db.add(user)
    for mid, name, color in MARKETS:
        db.add(Market(id=mid, name=name, brand_color=color))
    db.add(Product(id="p1", name="Banana Prata", category="Hortifrúti", unit="1 kg", image_url="data:,"))
    db.flush()
    db.add(Price(product_id="p1", market_id="giassi", value=5.49, source="crowd"))
    lst = ShoppingList(id="l1", name="Lista", owner_id=user.id)
    db.add(lst)
    db.flush()
    db.add(ListItem(list_id="l1", product_id="p1", quantity=2))
    db.commit()

    _seed(db)

    # Produto legado e dependências removidos; a lista (e o usuário) permanecem.
    assert db.get(Product, "p1") is None
    assert db.query(Price).filter(Price.product_id == "p1").count() == 0
    assert db.query(ListItem).filter(ListItem.product_id == "p1").count() == 0
    assert db.get(ShoppingList, "l1") is not None
    assert db.get(User, user.id) is not None


def test_no_foreign_key_violations(db: Session) -> None:
    """(14) Banco sem violações de chaves estrangeiras após o seed."""
    _seed(db)
    violations = db.execute(text("PRAGMA foreign_key_check")).fetchall()
    assert violations == []
