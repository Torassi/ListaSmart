"""Seed do catálogo — produtos REAIS com imagens locais (pasta `public/images`).

Substitui o catálogo fictício antigo (ids `p1..p20`) por 19 produtos reais,
um por imagem em `public/images/products/`. Cada produto recebe um preço por
supermercado (Giassi, Bistek, Angeloni, Fort Atacadista).

Uso (rode a migration ANTES — o seed não cria o schema):
    alembic upgrade head        # cria/evolui o schema (única fonte)
    python -m app.seed          # sincroniza o catálogo real

Idempotente e declarativo: executar de novo NÃO duplica produtos/preços e NÃO
faz o catálogo fictício reaparecer. O seed:
  - faz upsert dos 19 produtos reais (por id) e dos preços (por product+market);
  - REMOVE os produtos fictícios legados (`p1..p20`) e, junto, seus preços e
    itens de lista que os referenciavam (evita órfãos) — listas e usuários são
    preservados;
  - NÃO toca em produtos cadastrados manualmente pelo usuário (ids `prod_*`).

Preços: ESTIMATIVAS plausíveis para o varejo de Santa Catarina (pesquisa pública
aproximada em 2026-06-23). NÃO são preços oficiais nem em tempo real.

IMPORTANTE: o Alembic é a única fonte de criação/evolução do schema. Os campos
atuais de `Product` (name, brand, category, unit, image_url, barcode) já
suportam tudo — nenhuma migração nova é necessária.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import ListItem, Market, Price, Product, User
from app.security import hash_password

# Data da pesquisa/estimativa de preços (ver docstring).
PRICE_RESEARCH_DATE = datetime(2026, 6, 23, tzinfo=timezone.utc)

# Prefixo público das imagens (servidas pelo front em `public/images/products`).
IMAGE_PREFIX = "/images/products/"

# Mercados (id, nome, brandColor) — supermercados da região Sul (SC).
# O id "comper" é mantido por compatibilidade; o nome de exibição é Fort Atacadista.
MARKETS: list[tuple[str, str, str]] = [
    ("giassi", "Giassi", "#E11D48"),
    ("angeloni", "Angeloni", "#2563EB"),
    ("bistek", "Bistek", "#F59E0B"),
    ("comper", "Fort Atacadista", "#16A34A"),
]

# Catálogo fictício antigo, de responsabilidade deste seed. É REMOVIDO ao semear.
LEGACY_PRODUCT_IDS: list[str] = [f"p{i}" for i in range(1, 21)]

# Catálogo REAL. Cada item = um arquivo de imagem em `public/images/products/`.
#   id, nome comercial, marca, categoria, unidade, arquivo original (pasta img/),
#   arquivo público, preços por mercado.
# barcode NÃO é definido (não pode ser identificado com segurança a partir do
# nome do arquivo — não inventamos códigos de barras).
PRODUCTS: list[dict] = [
    {
        "id": "acucar_uniao_1kg", "name": "Açúcar Refinado União", "brand": "União",
        "category": "Mercearia", "unit": "1 kg",
        "original": "acucarrefinado_uniao_1kg.jpg", "image": "acucarrefinado_uniao_1kg.jpg",
        "prices": {"giassi": 4.79, "bistek": 4.59, "angeloni": 5.19, "comper": 4.39},
    },
    {
        "id": "arroz_tiojoao_1kg", "name": "Arroz Tio João Tipo 1", "brand": "Tio João",
        "category": "Mercearia", "unit": "1 kg",
        "original": "arroz_tiojoao_1kg.png", "image": "arroz_tiojoao_1kg.png",
        "prices": {"giassi": 6.99, "bistek": 6.59, "angeloni": 7.39, "comper": 6.79},
    },
    {
        "id": "biscoito_oreo_90g", "name": "Biscoito Oreo", "brand": "Oreo",
        "category": "Mercearia", "unit": "90 g",
        "original": "biscoito_oreo_90g.png", "image": "biscoito_oreo_90g.png",
        "prices": {"giassi": 3.19, "bistek": 3.39, "angeloni": 3.69, "comper": 3.29},
    },
    {
        "id": "cafe_pilao_500g", "name": "Café Pilão Tradicional", "brand": "Pilão",
        "category": "Mercearia", "unit": "500 g",
        "original": "cafe_pilao_500g.jpg", "image": "cafe_pilao_500g.jpg",
        "prices": {"giassi": 15.49, "bistek": 14.90, "angeloni": 16.49, "comper": 15.19},
    },
    {
        "id": "chocolate_lacta_80g", "name": "Chocolate ao Leite Lacta", "brand": "Lacta",
        "category": "Mercearia", "unit": "80 g",
        "original": "chocolateaoleite_lacta_80g.png", "image": "chocolateaoleite_lacta_80g.png",
        "prices": {"giassi": 6.49, "bistek": 6.29, "angeloni": 6.89, "comper": 5.99},
    },
    {
        "id": "cremedental_colgate_90g", "name": "Creme Dental Colgate", "brand": "Colgate",
        "category": "Higiene", "unit": "90 g",
        "original": "cremedental_colgate_90g.png", "image": "cremedental_colgate_90g.png",
        "prices": {"giassi": 3.99, "bistek": 4.29, "angeloni": 4.99, "comper": 4.19},
    },
    {
        "id": "feijao_kicaldo_1kg", "name": "Feijão Carioca Kicaldo", "brand": "Kicaldo",
        "category": "Mercearia", "unit": "1 kg",
        "original": "feijaocarioca_kicaldo_1kg.jpg", "image": "feijaocarioca_kicaldo_1kg.jpg",
        "prices": {"giassi": 8.49, "bistek": 8.19, "angeloni": 8.79, "comper": 7.99},
    },
    {
        "id": "guarana_antarctica_2l", "name": "Guaraná Antarctica", "brand": "Antarctica",
        "category": "Bebidas", "unit": "2 L",
        "original": "guarana_antarctica_2L.jpg", "image": "guarana_antarctica_2L.jpg",
        "prices": {"giassi": 9.49, "bistek": 8.99, "angeloni": 9.99, "comper": 9.29},
    },
    {
        "id": "iogurte_batavo_170g", "name": "Iogurte de Morango Batavo", "brand": "Batavo",
        "category": "Laticínios", "unit": "170 g",
        "original": "iogurtemorango_batavo_170g.png", "image": "iogurtemorango_batavo_170g.png",
        "prices": {"giassi": 2.99, "bistek": 2.89, "angeloni": 2.79, "comper": 3.09},
    },
    {
        "id": "leite_tirol_1l", "name": "Leite Integral Tirol", "brand": "Tirol",
        "category": "Laticínios", "unit": "1 L",
        "original": "leiteintegral_tirol_1L.png", "image": "leiteintegral_tirol_1L.png",
        "prices": {"giassi": 5.49, "bistek": 5.29, "angeloni": 5.79, "comper": 5.19},
    },
    {
        "id": "macarrao_isabela_500g", "name": "Macarrão Espaguete Isabela", "brand": "Isabela",
        "category": "Mercearia", "unit": "500 g",
        "original": "macarraoespaguete_isabela_500g.jpg", "image": "macarraoespaguete_isabela_500g.jpg",
        "prices": {"giassi": 3.79, "bistek": 3.99, "angeloni": 4.39, "comper": 3.89},
    },
    {
        "id": "maionese_hellmanns_500g", "name": "Maionese Hellmann's", "brand": "Hellmann's",
        "category": "Mercearia", "unit": "500 g",
        "original": "maionese_hellmanns_500g.jpg", "image": "maionese_hellmanns_500g.jpg",
        "prices": {"giassi": 8.99, "bistek": 8.49, "angeloni": 9.49, "comper": 8.79},
    },
    {
        "id": "molho_fugini_300g", "name": "Molho de Tomate Fugini", "brand": "Fugini",
        "category": "Mercearia", "unit": "300 g",
        "original": "molhotomate_fugini_300g.jpg", "image": "molhotomate_fugini_300g.jpg",
        "prices": {"giassi": 2.49, "bistek": 2.39, "angeloni": 2.79, "comper": 2.19},
    },
    {
        "id": "oleo_soya_900ml", "name": "Óleo de Soja Soya", "brand": "Soya",
        "category": "Mercearia", "unit": "900 ml",
        "original": "oleo_soya_900ml.jpg", "image": "oleo_soya_900ml.jpg",
        "prices": {"giassi": 7.29, "bistek": 7.49, "angeloni": 6.99, "comper": 7.19},
    },
    {
        "id": "papelhigienico_neve_12rolos", "name": "Papel Higiênico Neve", "brand": "Neve",
        "category": "Higiene", "unit": "12 rolos",
        "original": "papelhigiênico_neve_12rolos.jpg", "image": "papelhigienico_neve_12rolos.jpg",
        "prices": {"giassi": 21.90, "bistek": 20.90, "angeloni": 23.90, "comper": 19.90},
    },
    {
        "id": "queijo_tirol_300g", "name": "Queijo Mussarela Tirol", "brand": "Tirol",
        "category": "Laticínios", "unit": "300 g",
        "original": "queijomussarela_tirol_300g.png", "image": "queijomussarela_tirol_300g.png",
        "prices": {"giassi": 16.49, "bistek": 15.90, "angeloni": 17.49, "comper": 16.19},
    },
    {
        # Unidade NÃO consta no nome do arquivo: assumido 200 g (copo padrão Catupiry).
        "id": "requeijao_catupiry_200g", "name": "Requeijão Catupiry", "brand": "Catupiry",
        "category": "Laticínios", "unit": "200 g",
        "original": "requeijao_catupiry.png", "image": "requeijao_catupiry.png",
        "prices": {"giassi": 6.99, "bistek": 7.29, "angeloni": 7.99, "comper": 7.19},
    },
    {
        "id": "sardinha_gomesdacosta_125g", "name": "Sardinha Gomes da Costa",
        "brand": "Gomes da Costa", "category": "Mercearia", "unit": "125 g",
        "original": "sardinha_gomesdacosta_125g.png", "image": "sardinha_gomesdacosta_125g.png",
        "prices": {"giassi": 5.29, "bistek": 4.99, "angeloni": 5.69, "comper": 4.79},
    },
    {
        "id": "sucouva_delvalle_1l", "name": "Suco de Uva Del Valle", "brand": "Del Valle",
        "category": "Bebidas", "unit": "1 L",
        "original": "sucouva_delvalle_1L.jpg", "image": "sucouva_delvalle_1L.jpg",
        "prices": {"giassi": 7.99, "bistek": 8.19, "angeloni": 7.79, "comper": 8.09},
    },
]

# Conjunto de arquivos originais esperados na pasta `img/` (usado nos testes).
ORIGINAL_IMAGE_FILES: set[str] = {p["original"] for p in PRODUCTS}


def image_url_for(public_image: str) -> str:
    """URL pública (servida pelo front) de uma imagem de produto."""
    return f"{IMAGE_PREFIX}{public_image}"


def _is_two_decimals(value: float) -> bool:
    """Garante valor monetário positivo com no máximo 2 casas decimais."""
    return value > 0 and round(value, 2) == value


def apply_seed(db: Session) -> dict[str, int]:
    """Sincroniza o catálogo real no banco (sem commit; o chamador confirma).

    Idempotente: upsert de mercados/produtos/preços + remoção dos fictícios
    legados (com seus preços e itens de lista). Retorna contagens para log/teste.
    """
    new_ids = {p["id"] for p in PRODUCTS}

    # 1) Mercados (upsert por id).
    for market_id, name, color in MARKETS:
        market = db.get(Market, market_id)
        if market is None:
            db.add(Market(id=market_id, name=name, brand_color=color))
        else:
            market.name = name
            market.brand_color = color

    # 2) Remove o catálogo fictício legado (e o que ele referencia), evitando
    #    órfãos. Listas e usuários NÃO são apagados — apenas os itens que
    #    apontavam para produtos fictícios. Produtos manuais (`prod_*`) ficam.
    legacy_ids = [
        pid
        for pid in LEGACY_PRODUCT_IDS
        if pid not in new_ids and db.get(Product, pid) is not None
    ]
    removed_items = 0
    if legacy_ids:
        removed_items = (
            db.query(ListItem)
            .filter(ListItem.product_id.in_(legacy_ids))
            .delete(synchronize_session=False)
        )
        db.query(Price).filter(Price.product_id.in_(legacy_ids)).delete(
            synchronize_session=False
        )
        db.query(Product).filter(Product.id.in_(legacy_ids)).delete(
            synchronize_session=False
        )

    # 3) Produtos reais (upsert por id).
    for p in PRODUCTS:
        product = db.get(Product, p["id"])
        if product is None:
            db.add(
                Product(
                    id=p["id"],
                    name=p["name"],
                    brand=p["brand"],
                    category=p["category"],
                    unit=p["unit"],
                    image_url=image_url_for(p["image"]),
                    barcode=None,
                )
            )
        else:
            product.name = p["name"]
            product.brand = p["brand"]
            product.category = p["category"]
            product.unit = p["unit"]
            product.image_url = image_url_for(p["image"])
    db.flush()

    # 4) Preços por mercado (upsert por chave composta product+market).
    price_count = 0
    for p in PRODUCTS:
        for market_id, value in p["prices"].items():
            value = round(value, 2)
            price = db.get(Price, (p["id"], market_id))
            if price is None:
                db.add(
                    Price(
                        product_id=p["id"],
                        market_id=market_id,
                        value=value,
                        source="crowd",
                        updated_at=PRICE_RESEARCH_DATE,
                    )
                )
            else:
                price.value = value
                price.source = "crowd"
                price.updated_at = PRICE_RESEARCH_DATE
            price_count += 1

    # 5) Conta de demonstração (idempotente).
    if db.query(User).filter(User.email == "demo@listasmart.com").first() is None:
        db.add(
            User(
                name="Demonstração",
                email="demo@listasmart.com",
                password_hash=hash_password("12345678"),
            )
        )

    return {
        "markets": len(MARKETS),
        "products": len(PRODUCTS),
        "prices": price_count,
        "legacy_removed": len(legacy_ids),
        "list_items_removed": removed_items,
    }


def seed() -> None:
    # O schema é responsabilidade do Alembic. Se as tabelas não existem, oriente
    # a rodar a migration antes de semear (não criamos o schema aqui).
    if not inspect(engine).has_table("products"):
        raise SystemExit(
            "Schema ausente: rode `alembic upgrade head` antes de `python -m app.seed`."
        )

    db = SessionLocal()
    try:
        stats = apply_seed(db)
        db.commit()
        print(
            "Seed concluído: "
            f"{stats['markets']} mercados, {stats['products']} produtos reais, "
            f"{stats['prices']} preços. "
            f"Removidos {stats['legacy_removed']} produtos fictícios e "
            f"{stats['list_items_removed']} itens de lista órfãos."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
