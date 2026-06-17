"""Fixtures de teste: banco SQLite em memória isolado + catálogo mínimo."""
from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Market, Price, Product

# Banco em memória compartilhado entre as conexões do teste.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _db() -> Generator[None, None, None]:
    """Recria o schema e popula um catálogo mínimo antes de cada teste."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        db.add_all(
            [
                Market(id="giassi", name="Giassi", brand_color="#E11D48"),
                Market(id="bistek", name="Bistek", brand_color="#F59E0B"),
                Product(
                    id="p1",
                    name="Banana Prata",
                    category="Hortifrúti",
                    unit="1 kg",
                    image_url="data:,",
                    barcode="7891000000000",
                ),
                Product(
                    id="p2",
                    name="Leite Integral",
                    category="Laticínios",
                    unit="1 L",
                    brand="Tirol",
                    image_url="data:,",
                    barcode="7891000000001",
                ),
            ]
        )
        db.add_all(
            [
                Price(product_id="p1", market_id="giassi", value=5.49, source="crowd"),
                Price(product_id="p1", market_id="bistek", value=5.00, source="crowd"),
                Price(product_id="p2", market_id="giassi", value=5.29, source="crowd"),
                Price(product_id="p2", market_id="bistek", value=4.97, source="crowd"),
            ]
        )
        db.commit()
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_client(client: TestClient) -> TestClient:
    """Cliente já autenticado (cookie de sessão definido via signup)."""
    res = client.post(
        "/api/auth/signup",
        json={"name": "Teste", "email": "teste@exemplo.com", "password": "12345678"},
    )
    assert res.status_code == 201, res.text
    return client
