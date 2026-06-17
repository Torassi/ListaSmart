"""Testes do fluxo principal: auth, catálogo, listas, preços e comparação."""
from __future__ import annotations

from fastapi.testclient import TestClient


# --------------------------------------------------------------------------- #
# Autenticação
# --------------------------------------------------------------------------- #
def test_signup_login_me_logout(client: TestClient) -> None:
    res = client.post(
        "/api/auth/signup",
        json={"name": "Ana", "email": "ana@exemplo.com", "password": "12345678"},
    )
    assert res.status_code == 201
    assert res.json()["email"] == "ana@exemplo.com"
    assert "id" in res.json()

    # /me funciona com o cookie de sessão
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["name"] == "Ana"

    # logout limpa a sessão
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_signup_duplicate_email(client: TestClient) -> None:
    payload = {"name": "Ana", "email": "dup@exemplo.com", "password": "12345678"}
    assert client.post("/api/auth/signup", json=payload).status_code == 201
    res = client.post("/api/auth/signup", json=payload)
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "email_taken"


def test_login_invalid_credentials(client: TestClient) -> None:
    res = client.post(
        "/api/auth/login",
        json={"email": "naoexiste@exemplo.com", "password": "12345678"},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "invalid_credentials"


def test_update_profile(auth_client: TestClient) -> None:
    res = auth_client.patch("/api/auth/me", json={"name": "Novo Nome"})
    assert res.status_code == 200
    assert res.json()["name"] == "Novo Nome"


def test_private_routes_require_auth(client: TestClient) -> None:
    assert client.get("/api/lists").status_code == 401


# --------------------------------------------------------------------------- #
# Catálogo
# --------------------------------------------------------------------------- #
def test_list_products_with_lowest_price(client: TestClient) -> None:
    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) == 2
    banana = next(p for p in products if p["id"] == "p1")
    assert banana["lowestPrice"] == 5.00  # menor entre giassi/bistek
    assert "imageUrl" in banana  # camelCase do contrato


def test_search_products(client: TestClient) -> None:
    assert len(client.get("/api/products", params={"q": "leite"}).json()) == 1
    assert len(client.get("/api/products", params={"category": "Hortifrúti"}).json()) == 1
    by_barcode = client.get("/api/products", params={"barcode": "7891000000001"}).json()
    assert len(by_barcode) == 1 and by_barcode[0]["id"] == "p2"


def test_categories_and_markets(client: TestClient) -> None:
    cats = client.get("/api/categories").json()
    assert "Hortifrúti" in cats and "Laticínios" in cats
    markets = client.get("/api/markets").json()
    assert {m["id"] for m in markets} == {"giassi", "bistek"}


# --------------------------------------------------------------------------- #
# Listas
# --------------------------------------------------------------------------- #
def test_list_crud_and_items(auth_client: TestClient) -> None:
    created = auth_client.post("/api/lists", json={"name": "Compra do mês"})
    assert created.status_code == 201
    list_id = created.json()["id"]
    assert created.json()["collaborators"][0]["email"] == "teste@exemplo.com"

    # listar
    assert len(auth_client.get("/api/lists").json()) == 1

    # renomear
    renamed = auth_client.patch(f"/api/lists/{list_id}", json={"name": "Renomeada"})
    assert renamed.json()["name"] == "Renomeada"

    # adicionar item
    added = auth_client.post(
        f"/api/lists/{list_id}/items", json={"productId": "p1", "quantity": 2}
    )
    assert added.status_code == 201
    assert added.json()["items"][0]["product"]["id"] == "p1"
    assert added.json()["items"][0]["quantity"] == 2

    # adicionar de novo soma quantidade
    again = auth_client.post(
        f"/api/lists/{list_id}/items", json={"productId": "p1", "quantity": 3}
    )
    assert again.json()["items"][0]["quantity"] == 5

    # alterar quantidade
    upd = auth_client.patch(
        f"/api/lists/{list_id}/items/p1", json={"quantity": 1}
    )
    assert upd.json()["items"][0]["quantity"] == 1

    # remover item
    removed = auth_client.delete(f"/api/lists/{list_id}/items/p1")
    assert removed.json()["items"] == []

    # limpar lista
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p2"})
    cleared = auth_client.delete(f"/api/lists/{list_id}/items")
    assert cleared.json()["items"] == []

    # excluir lista
    assert auth_client.delete(f"/api/lists/{list_id}").status_code == 204
    assert auth_client.get(f"/api/lists/{list_id}").status_code == 404


def test_user_cannot_access_others_list(auth_client: TestClient, client: TestClient) -> None:
    list_id = auth_client.post("/api/lists", json={"name": "Minha"}).json()["id"]

    other = TestClient(client.app)
    other.post(
        "/api/auth/signup",
        json={"name": "Outro", "email": "outro@exemplo.com", "password": "12345678"},
    )
    assert other.get(f"/api/lists/{list_id}").status_code == 404


# --------------------------------------------------------------------------- #
# Preços
# --------------------------------------------------------------------------- #
def test_register_manual_price_upsert(auth_client: TestClient) -> None:
    res = auth_client.post(
        "/api/prices", json={"productId": "p1", "marketId": "giassi", "value": 4.20}
    )
    assert res.status_code == 201
    assert res.json()["source"] == "manual"

    matrix = auth_client.get("/api/prices/matrix").json()
    assert matrix["p1"]["giassi"] == 4.20


def test_register_price_unknown_product(auth_client: TestClient) -> None:
    res = auth_client.post(
        "/api/prices", json={"productId": "nope", "marketId": "giassi", "value": 1.0}
    )
    assert res.status_code == 404


# --------------------------------------------------------------------------- #
# Comparação
# --------------------------------------------------------------------------- #
def test_compare_list(auth_client: TestClient) -> None:
    list_id = auth_client.post("/api/lists", json={"name": "Comparar"}).json()["id"]
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p1", "quantity": 2})
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p2", "quantity": 1})

    comp = auth_client.get(f"/api/lists/{list_id}/comparison").json()

    # Totais: bistek = 5.00*2 + 4.97 = 14.97 ; giassi = 5.49*2 + 5.29 = 16.27
    totals = {t["marketId"]: t["total"] for t in comp["totals"]}
    assert totals["bistek"] == 14.97
    assert totals["giassi"] == 16.27
    assert comp["cheapestMarketId"] == "bistek"
    assert comp["mostExpensiveMarketId"] == "giassi"
    assert comp["savedAmount"] == round(16.27 - 14.97, 2)

    # destaque de menor/maior na primeira linha
    row = comp["rows"][0]
    cheapest_cell = next(c for c in row["cells"] if c["marketId"] == "bistek")
    assert cheapest_cell["isCheapest"] is True
