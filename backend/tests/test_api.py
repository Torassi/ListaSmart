"""Testes do fluxo principal: auth, catálogo, listas, preços e comparação."""
from __future__ import annotations

import time
from datetime import datetime

from fastapi.testclient import TestClient


def _parsed(iso: str) -> datetime:
    """Converte o timestamp ISO devolvido pela API em datetime para comparar."""
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


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

    # ambos os mercados têm preço para todos os itens → cobertura completa
    totals_by_market = {t["marketId"]: t for t in comp["totals"]}
    assert totals_by_market["giassi"]["complete"] is True
    assert totals_by_market["bistek"]["complete"] is True


def test_comparison_ignores_incomplete_markets(auth_client: TestClient) -> None:
    """Mercado sem preço para TODOS os itens não pode ser o "mais barato"."""
    # Produto novo com preço APENAS na giassi (bistek fica sem cobertura).
    created = auth_client.post(
        "/api/products",
        json={
            "name": "Produto Exclusivo",
            "category": "Mercearia",
            "unit": "unidade",
            "marketId": "giassi",
            "price": 3.00,
        },
    )
    assert created.status_code == 201, created.text
    pid = created.json()["id"]

    list_id = auth_client.post("/api/lists", json={"name": "Cobertura"}).json()["id"]
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p1"})
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": pid})

    comp = auth_client.get(f"/api/lists/{list_id}/comparison").json()
    totals = {t["marketId"]: t for t in comp["totals"]}

    # giassi tem p1 e o produto exclusivo → completo; bistek só tem p1 → incompleto.
    assert totals["giassi"]["complete"] is True
    assert totals["bistek"]["complete"] is False
    assert totals["bistek"]["total"] > 0  # bistek tem total parcial...

    # ...mas, por não ter cobertura completa, NÃO pode ser escolhido.
    assert comp["cheapestMarketId"] == "giassi"
    assert comp["mostExpensiveMarketId"] == "giassi"
    assert comp["savedAmount"] == 0.0


# --------------------------------------------------------------------------- #
# updatedAt / ordenação por atividade recente
# --------------------------------------------------------------------------- #
def test_updated_at_changes_on_item_mutations(auth_client: TestClient) -> None:
    created = auth_client.post("/api/lists", json={"name": "Atividade"}).json()
    list_id = created["id"]
    t_created = _parsed(created["updatedAt"])

    time.sleep(0.01)
    added = auth_client.post(
        f"/api/lists/{list_id}/items", json={"productId": "p1"}
    ).json()
    assert _parsed(added["updatedAt"]) > t_created

    time.sleep(0.01)
    changed = auth_client.patch(
        f"/api/lists/{list_id}/items/p1", json={"quantity": 3}
    ).json()
    assert _parsed(changed["updatedAt"]) > _parsed(added["updatedAt"])

    time.sleep(0.01)
    removed = auth_client.delete(f"/api/lists/{list_id}/items/p1").json()
    assert _parsed(removed["updatedAt"]) > _parsed(changed["updatedAt"])

    time.sleep(0.01)
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p2"})
    before_clear = auth_client.get(f"/api/lists/{list_id}").json()["updatedAt"]
    time.sleep(0.01)
    cleared = auth_client.delete(f"/api/lists/{list_id}/items").json()
    assert _parsed(cleared["updatedAt"]) > _parsed(before_clear)


def test_lists_ordered_by_recent_activity(auth_client: TestClient) -> None:
    a = auth_client.post("/api/lists", json={"name": "A"}).json()["id"]
    time.sleep(0.01)
    b = auth_client.post("/api/lists", json={"name": "B"}).json()["id"]

    # B é a mais recente → aparece primeiro.
    order = [item["id"] for item in auth_client.get("/api/lists").json()]
    assert order[0] == b

    # Mexer em A (adicionar item) deve trazê-la para o topo.
    time.sleep(0.01)
    auth_client.post(f"/api/lists/{a}/items", json={"productId": "p1"})
    order2 = [item["id"] for item in auth_client.get("/api/lists").json()]
    assert order2[0] == a


# --------------------------------------------------------------------------- #
# Cadastro manual de produto (POST /products)
# --------------------------------------------------------------------------- #
def test_create_product_with_initial_price(auth_client: TestClient) -> None:
    res = auth_client.post(
        "/api/products",
        json={
            "name": "Arroz Integral",
            "category": "Mercearia",
            "unit": "1 kg",
            "barcode": "7899999999999",
            "marketId": "giassi",
            "price": 12.5,
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["name"] == "Arroz Integral"
    assert body["lowestPrice"] == 12.5
    pid = body["id"]

    # Aparece no catálogo (busca por código de barras).
    found = auth_client.get("/api/products", params={"barcode": "7899999999999"}).json()
    assert len(found) == 1 and found[0]["id"] == pid

    # Preço inicial registrado na matriz.
    matrix = auth_client.get("/api/prices/matrix").json()
    assert matrix[pid]["giassi"] == 12.5


def test_create_product_dedup_reuses_id_across_markets(auth_client: TestClient) -> None:
    """Cadastrar o mesmo produto (caixa/espaços diferentes) reutiliza o id e só
    adiciona/atualiza preços, sem duplicar o catálogo."""
    # (1) Primeiro cadastro de "Arroz Branco" no mercado A (giassi).
    first = auth_client.post(
        "/api/products",
        json={
            "name": "Arroz Branco",
            "category": "Mercearia",
            "unit": "5 kg",
            "marketId": "giassi",
            "price": 25.00,
        },
    )
    assert first.status_code == 201, first.text
    pid = first.json()["id"]
    assert first.json()["lowestPrice"] == 25.00

    # (2) Segundo cadastro com diferenças de caixa/espaços no mercado B (bistek).
    second = auth_client.post(
        "/api/products",
        json={
            "name": "  arroz   branco ",
            "category": "Mercearia",
            "unit": " 5 KG ",
            "marketId": "bistek",
            "price": 22.00,
        },
    )
    assert second.status_code == 201, second.text
    # Mesmo id reutilizado e menor preço entre os mercados.
    assert second.json()["id"] == pid
    assert second.json()["lowestPrice"] == 22.00

    # (3) Apenas um produto "Arroz Branco" no catálogo (p1/p2 do seed continuam).
    catalog = auth_client.get("/api/products", params={"q": "Arroz Branco"}).json()
    assert len(catalog) == 1 and catalog[0]["id"] == pid

    # (4) Dois preços associados ao mesmo product_id.
    matrix = auth_client.get("/api/prices/matrix").json()
    assert matrix[pid] == {"giassi": 25.00, "bistek": 22.00}

    # (5) Novo cadastro no mercado A atualiza o preço existente (não duplica).
    update = auth_client.post(
        "/api/products",
        json={
            "name": "Arroz Branco",
            "category": "Mercearia",
            "unit": "5 kg",
            "marketId": "giassi",
            "price": 19.90,
        },
    )
    assert update.status_code == 201, update.text
    assert update.json()["id"] == pid
    assert update.json()["lowestPrice"] == 19.90  # menor agora é o de giassi
    matrix = auth_client.get("/api/prices/matrix").json()
    assert matrix[pid] == {"giassi": 19.90, "bistek": 22.00}


def test_create_product_different_units_not_merged(auth_client: TestClient) -> None:
    """(6) Mesmo nome/categoria mas unidades diferentes são produtos distintos."""
    one_kg = auth_client.post(
        "/api/products",
        json={
            "name": "Arroz",
            "category": "Mercearia",
            "unit": "1 kg",
            "marketId": "giassi",
            "price": 6.0,
        },
    )
    five_kg = auth_client.post(
        "/api/products",
        json={
            "name": "Arroz",
            "category": "Mercearia",
            "unit": "5 kg",
            "marketId": "giassi",
            "price": 25.0,
        },
    )
    assert one_kg.status_code == 201 and five_kg.status_code == 201
    assert one_kg.json()["id"] != five_kg.json()["id"]
    catalog = auth_client.get("/api/products", params={"q": "Arroz"}).json()
    assert len({p["id"] for p in catalog}) == 2


def test_create_product_barcode_conflict_same_identity(auth_client: TestClient) -> None:
    """(7) Mesmo produto (nome/unidade/categoria) cadastrado depois com OUTRO
    código de barras: conflito claro, sem mesclar."""
    auth_client.post(
        "/api/products",
        json={
            "name": "Feijão Carioca",
            "category": "Mercearia",
            "unit": "1 kg",
            "barcode": "7890000000001",
            "marketId": "giassi",
            "price": 8.0,
        },
    )
    res = auth_client.post(
        "/api/products",
        json={
            "name": "Feijão Carioca",
            "category": "Mercearia",
            "unit": "1 kg",
            "barcode": "7890000000002",  # código divergente
            "marketId": "bistek",
            "price": 7.5,
        },
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "barcode_conflict"


def test_create_product_same_barcode_reuses(auth_client: TestClient) -> None:
    """Reenvio com o mesmo código de barras e identidade igual reutiliza o produto."""
    first = auth_client.post(
        "/api/products",
        json={
            "name": "Açúcar Refinado",
            "category": "Mercearia",
            "unit": "1 kg",
            "barcode": "7890000000010",
            "marketId": "giassi",
            "price": 4.5,
        },
    )
    second = auth_client.post(
        "/api/products",
        json={
            "name": "açúcar refinado",
            "category": "Mercearia",
            "unit": "1 kg",
            "barcode": "7890000000010",
            "marketId": "bistek",
            "price": 4.0,
        },
    )
    assert first.status_code == 201 and second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert second.json()["lowestPrice"] == 4.0


def test_create_product_duplicate_barcode(auth_client: TestClient) -> None:
    # 7891000000000 é o código de barras de p1 (ver conftest).
    res = auth_client.post(
        "/api/products",
        json={
            "name": "Outro Produto",
            "category": "Mercearia",
            "unit": "unidade",
            "barcode": "7891000000000",
            "marketId": "giassi",
            "price": 1.0,
        },
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "barcode_taken"


def test_create_product_requires_auth(client: TestClient) -> None:
    res = client.post(
        "/api/products",
        json={
            "name": "Sem Login",
            "category": "Mercearia",
            "unit": "unidade",
            "marketId": "giassi",
            "price": 1.0,
        },
    )
    assert res.status_code == 401


def test_create_product_invalid_category(auth_client: TestClient) -> None:
    res = auth_client.post(
        "/api/products",
        json={
            "name": "Categoria Errada",
            "category": "Inexistente",
            "unit": "unidade",
            "marketId": "giassi",
            "price": 1.0,
        },
    )
    assert res.status_code == 422


def test_create_product_unknown_market(auth_client: TestClient) -> None:
    res = auth_client.post(
        "/api/products",
        json={
            "name": "Mercado Errado",
            "category": "Mercearia",
            "unit": "unidade",
            "marketId": "nao-existe",
            "price": 1.0,
        },
    )
    assert res.status_code == 404


def test_create_product_invalid_barcode(auth_client: TestClient) -> None:
    res = auth_client.post(
        "/api/products",
        json={
            "name": "Barcode Curto",
            "category": "Mercearia",
            "unit": "unidade",
            "barcode": "123",
            "marketId": "giassi",
            "price": 1.0,
        },
    )
    assert res.status_code == 422


# --------------------------------------------------------------------------- #
# CSRF
# --------------------------------------------------------------------------- #
def test_csrf_blocks_authenticated_state_change_without_token(
    auth_client: TestClient,
) -> None:
    # Sobrescreve o header CSRF com vazio para simular requisição sem token.
    res = auth_client.post(
        "/api/lists", json={"name": "Sem CSRF"}, headers={"X-CSRF-Token": ""}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "csrf_failed"
