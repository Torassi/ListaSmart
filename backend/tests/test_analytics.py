"""Testes de integridade (FKs/cascatas) e do dashboard de inteligência."""
from __future__ import annotations

from sqlalchemy import create_engine, text
from fastapi.testclient import TestClient

from tests.conftest import TestingSessionLocal


# --------------------------------------------------------------------------- #
# Integridade referencial (PRAGMA foreign_keys + cascatas)
# --------------------------------------------------------------------------- #
def test_foreign_keys_pragma_enabled() -> None:
    """Toda conexão SQLite deve subir com PRAGMA foreign_keys = 1."""
    engine = create_engine("sqlite://")
    with engine.connect() as conn:
        assert conn.execute(text("PRAGMA foreign_keys")).scalar() == 1


def test_delete_list_cascades_items(auth_client: TestClient) -> None:
    list_id = auth_client.post("/api/lists", json={"name": "X"}).json()["id"]
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p1"})

    with TestingSessionLocal() as s:
        count = s.execute(
            text("SELECT count(*) FROM list_items WHERE list_id=:id"), {"id": list_id}
        ).scalar()
        assert count == 1
        # Exclusão direta no banco (exercita o ON DELETE CASCADE, não a ORM).
        s.execute(text("DELETE FROM shopping_lists WHERE id=:id"), {"id": list_id})
        s.commit()
        remaining = s.execute(
            text("SELECT count(*) FROM list_items WHERE list_id=:id"), {"id": list_id}
        ).scalar()
        assert remaining == 0


def test_delete_user_respects_relationships(auth_client: TestClient) -> None:
    # Cria produto (created_by), preço manual (created_by), lista, busca e snapshot.
    prod = auth_client.post(
        "/api/products",
        json={"name": "Autoria", "category": "Mercearia", "unit": "un",
              "marketId": "giassi", "price": 3.0},
    ).json()
    auth_client.post("/api/analytics/search-events", json={"productId": "p1"})
    list_id = auth_client.post("/api/lists", json={"name": "L"}).json()["id"]
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p1"})
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p2"})
    auth_client.post(f"/api/lists/{list_id}/comparison-snapshots")

    user_id = auth_client.get("/api/auth/me").json()["id"]
    with TestingSessionLocal() as s:
        s.execute(text("DELETE FROM users WHERE id=:id"), {"id": user_id})
        s.commit()
        # CASCADE: listas e snapshots do usuário somem.
        assert s.execute(text("SELECT count(*) FROM shopping_lists WHERE owner_id=:id"), {"id": user_id}).scalar() == 0
        assert s.execute(text("SELECT count(*) FROM comparison_snapshots WHERE user_id=:id"), {"id": user_id}).scalar() == 0
        # SET NULL: autoria de produto/preço e busca ficam órfãs, sem apagar o dado.
        assert s.execute(text("SELECT created_by FROM products WHERE id=:id"), {"id": prod["id"]}).scalar() is None
        assert s.execute(text("SELECT count(*) FROM products WHERE id=:id"), {"id": prod["id"]}).scalar() == 1
        assert s.execute(text("SELECT user_id FROM search_events")).scalar() is None


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _make_partial_product(client: TestClient, name: str, market_id: str, price: float) -> str:
    return client.post(
        "/api/products",
        json={"name": name, "category": "Mercearia", "unit": "un",
              "marketId": market_id, "price": price},
    ).json()["id"]


# --------------------------------------------------------------------------- #
# Analytics
# --------------------------------------------------------------------------- #
def test_analytics_empty_for_new_user(auth_client: TestClient) -> None:
    data = auth_client.get("/api/analytics").json()
    assert data["manualPricesCount"] == 0  # seed usa source "crowd"
    assert data["categoryShares"] == []
    assert data["mostSearchedProducts"] == []
    assert all(m["cheapestWins"] == 0 for m in data["marketCompetitiveness"])
    assert data["avgSavingsPerUser"] == 0
    assert data["cheapestMarketByList"] == "—"
    # Oportunidades vêm do catálogo seed (p1/p2 têm variação entre mercados).
    assert len(data["opportunities"]) == 2


def test_manual_prices_count(auth_client: TestClient) -> None:
    auth_client.post("/api/prices", json={"productId": "p1", "marketId": "giassi", "value": 4.2})
    data = auth_client.get("/api/analytics").json()
    assert data["manualPricesCount"] == 1


def test_price_opportunities_sorted_by_diff(auth_client: TestClient) -> None:
    ops = auth_client.get("/api/analytics").json()["opportunities"]
    # p1 varia 0.49 (5.49-5.00); p2 varia 0.32 (5.29-4.97) -> p1 primeiro.
    assert ops[0]["product"]["id"] == "p1"
    assert ops[0]["diff"] >= ops[1]["diff"]


def test_category_search_aggregation(auth_client: TestClient) -> None:
    """Categorias mais pesquisadas vêm dos eventos de busca; o ranking de PRODUTOS
    NÃO depende de buscas (conta listas finalizadas — ver teste dedicado)."""
    auth_client.post("/api/analytics/search-events", json={"productId": "p1"})
    auth_client.post("/api/analytics/search-events", json={"category": "Hortifrúti"})

    data = auth_client.get("/api/analytics").json()
    cats = {c["category"]: c["searches"] for c in data["categoryShares"]}
    assert cats["Hortifrúti"] == 1
    # Eventos de busca não alimentam mais "produtos mais listados".
    assert data["mostSearchedProducts"] == []


def test_most_listed_products_counts_finalized_lists(auth_client: TestClient) -> None:
    """O ranking de produtos conta quantas listas FINALIZADAS contêm cada item."""
    list_id = _list_with_full_coverage(auth_client)  # adiciona p1 e p2
    # Antes de finalizar, não conta.
    assert auth_client.get("/api/analytics").json()["mostSearchedProducts"] == []

    auth_client.post(f"/api/lists/{list_id}/comparison-snapshots")  # finaliza
    ranked = {r["product"]["id"]: r["searches"] for r in auth_client.get("/api/analytics").json()["mostSearchedProducts"]}
    assert ranked.get("p1") == 1
    assert ranked.get("p2") == 1


def test_search_event_requires_auth(client: TestClient) -> None:
    assert client.post("/api/analytics/search-events", json={"query": "x"}).status_code == 401


def test_search_event_empty_rejected(auth_client: TestClient) -> None:
    assert auth_client.post("/api/analytics/search-events", json={}).status_code == 422


# --------------------------------------------------------------------------- #
# Snapshots de comparação + competitividade + economia recente
# --------------------------------------------------------------------------- #
def _list_with_full_coverage(client: TestClient) -> str:
    list_id = client.post("/api/lists", json={"name": "Comparar"}).json()["id"]
    client.post(f"/api/lists/{list_id}/items", json={"productId": "p1"})
    client.post(f"/api/lists/{list_id}/items", json={"productId": "p2"})
    return list_id


def test_comparison_snapshot_and_competitiveness(auth_client: TestClient) -> None:
    list_id = _list_with_full_coverage(auth_client)
    snap = auth_client.post(f"/api/lists/{list_id}/comparison-snapshots")
    assert snap.status_code == 201, snap.text
    body = snap.json()
    # bistek (9.97) é o mais barato; giassi (10.78) o mais caro; economia 0.81.
    assert body["cheapestMarketId"] == "bistek"
    assert body["savedAmount"] == 0.81

    data = auth_client.get("/api/analytics").json()
    wins = {m["market"]["id"]: m["cheapestWins"] for m in data["marketCompetitiveness"]}
    assert wins["bistek"] == 1
    assert data["cheapestMarketByList"] == "Bistek"
    assert data["avgSavingsPerUser"] == 0.81


def test_snapshot_requires_complete_coverage(auth_client: TestClient) -> None:
    a = _make_partial_product(auth_client, "Só Giassi", "giassi", 2.0)
    b = _make_partial_product(auth_client, "Só Bistek", "bistek", 2.0)
    list_id = auth_client.post("/api/lists", json={"name": "Parcial"}).json()["id"]
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": a})
    auth_client.post(f"/api/lists/{list_id}/items", json={"productId": b})

    res = auth_client.post(f"/api/lists/{list_id}/comparison-snapshots")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "incomplete_coverage"


def test_snapshot_once_per_list(auth_client: TestClient) -> None:
    """Registrar economia/finalizar é idempotente por lista: um único snapshot."""
    list_id = _list_with_full_coverage(auth_client)
    first = auth_client.post(f"/api/lists/{list_id}/comparison-snapshots").json()
    second = auth_client.post(f"/api/lists/{list_id}/comparison-snapshots").json()
    assert first["id"] == second["id"]  # mesma economia, sem duplicar no dashboard
    # E a lista fica finalizada após registrar.
    assert auth_client.get(f"/api/lists/{list_id}").json()["finalized"] is True


def test_finalized_list_blocks_edit_and_delete(auth_client: TestClient) -> None:
    """Após finalizar (snapshot), a lista não pode ser editada nem excluída."""
    list_id = _list_with_full_coverage(auth_client)
    auth_client.post(f"/api/lists/{list_id}/comparison-snapshots")

    # Não pode adicionar item…
    add = auth_client.post(f"/api/lists/{list_id}/items", json={"productId": "p1"})
    assert add.status_code == 409 and add.json()["error"]["code"] == "list_finalized"
    # …nem excluir a lista.
    delete = auth_client.delete(f"/api/lists/{list_id}")
    assert delete.status_code == 409 and delete.json()["error"]["code"] == "list_finalized"


def test_editable_list_can_be_deleted(auth_client: TestClient) -> None:
    """Enquanto NÃO finalizada, a lista pode ser excluída normalmente."""
    list_id = auth_client.post("/api/lists", json={"name": "Rascunho"}).json()["id"]
    assert auth_client.delete(f"/api/lists/{list_id}").status_code == 204


def test_recent_savings(auth_client: TestClient) -> None:
    list_id = _list_with_full_coverage(auth_client)
    auth_client.post(f"/api/lists/{list_id}/comparison-snapshots")

    recent = auth_client.get("/api/savings/recent").json()
    assert len(recent) == 1
    assert recent[0]["listName"] == "Comparar"
    assert recent[0]["cheapestMarket"] == "Bistek"
    assert recent[0]["savedAmount"] == 0.81


def test_dashboard_is_global_savings_recent_is_personal(
    auth_client: TestClient, client: TestClient
) -> None:
    """O dashboard de inteligência é GLOBAL (dados de todos os usuários);
    já `savings/recent` da Home continua PESSOAL."""
    list_id = _list_with_full_coverage(auth_client)
    auth_client.post(f"/api/lists/{list_id}/comparison-snapshots")
    auth_client.post("/api/analytics/search-events", json={"productId": "p1"})

    other = TestClient(client.app)
    other.post("/api/auth/signup", json={"name": "Outro", "email": "outro@x.com", "password": "12345678"})
    other.headers["X-CSRF-Token"] = other.cookies.get("listasmart_csrf") or ""

    # savings/recent é PESSOAL: o outro usuário não vê as economias da conta anterior.
    assert other.get("/api/savings/recent").json() == []

    # Dashboard é GLOBAL: o outro usuário VÊ os dados agregados de todos.
    data = other.get("/api/analytics").json()
    assert data["avgSavingsPerUser"] == 0.81
    wins = {m["market"]["id"]: m["cheapestWins"] for m in data["marketCompetitiveness"]}
    assert wins["bistek"] == 1
    assert data["cheapestMarketByList"] == "Bistek"
