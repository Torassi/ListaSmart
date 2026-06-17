"""Seed inicial do banco — espelha os dados mockados do front-end.

Reproduz `src/services/mockData.ts`: mercados, catálogo de produtos (com código
de barras determinístico) e a matriz de preços. Também cria uma conta de
demonstração para facilitar os testes (demo@listasmart.com / 12345678).

Uso:
    python -m app.seed          # cria as tabelas (se preciso) e popula

É idempotente: se já houver produtos, não duplica nada.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from urllib.parse import quote

from app.database import Base, SessionLocal, engine
from app.models import Market, Price, Product, User
from app.security import hash_password

# Mesma data dos preços mockados do front.
SEED_UPDATED_AT = datetime(2026, 6, 1, 10, 0, 0, tzinfo=timezone.utc)


def _placeholder(emoji: str, bg: str = "#E9F8F1") -> str:
    """Replica `productPlaceholder` do front (data URI SVG, 100% offline)."""
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" '
        'viewBox="0 0 400 300">\n'
        f'    <rect width="400" height="300" fill="{bg}"/>\n'
        '    <text x="50%" y="50%" dominant-baseline="central" '
        f'text-anchor="middle" font-size="140">{emoji}</text>\n'
        "  </svg>"
    )
    # encodeURIComponent não escapa estes caracteres.
    return "data:image/svg+xml;utf8," + quote(svg, safe="-_.!~*'()")


# Mercados (id, nome, brandColor) — igual ao mock.
MARKETS: list[tuple[str, str, str]] = [
    ("giassi", "Giassi", "#E11D48"),
    ("angeloni", "Angeloni", "#2563EB"),
    ("bistek", "Bistek", "#F59E0B"),
    ("comper", "Comper", "#16A34A"),
]

# Catálogo: (id, nome, categoria, unidade, emoji, bg, marca opcional).
CATALOG: list[tuple[str, str, str, str, str, str, str | None]] = [
    ("p1", "Banana Prata", "Hortifrúti", "1 kg", "🍌", "#E9F8F1", None),
    ("p2", "Tomate Italiano", "Hortifrúti", "1 kg", "🍅", "#E9F8F1", None),
    ("p3", "Alface Crespa", "Hortifrúti", "unidade", "🥬", "#E9F8F1", None),
    ("p4", "Picanha Bovina", "Açougue", "1 kg", "🥩", "#FDECEC", None),
    ("p5", "Peito de Frango", "Açougue", "1 kg", "🍗", "#FDECEC", None),
    ("p6", "Pão Francês", "Padaria", "1 kg", "🥖", "#FEF3E2", None),
    ("p7", "Leite Integral", "Laticínios", "1 L", "🥛", "#EAF1FF", "Tirol"),
    ("p8", "Queijo Mussarela", "Laticínios", "500 g", "🧀", "#EAF1FF", None),
    ("p9", "Ovos Brancos", "Mercearia", "dúzia", "🥚", "#FEF3E2", None),
    ("p10", "Arroz Branco", "Mercearia", "5 kg", "🍚", "#FEF3E2", "Tio João"),
    ("p11", "Feijão Preto", "Mercearia", "1 kg", "🫘", "#FEF3E2", None),
    ("p12", "Café Torrado", "Mercearia", "500 g", "☕", "#FEF3E2", "Melitta"),
    ("p13", "Macarrão Espaguete", "Mercearia", "500 g", "🍝", "#FEF3E2", None),
    ("p14", "Refrigerante Cola", "Bebidas", "2 L", "🥤", "#EAF1FF", None),
    ("p15", "Suco de Laranja", "Bebidas", "1 L", "🧃", "#EAF1FF", None),
    ("p16", "Detergente Neutro", "Limpeza", "500 ml", "🧴", "#EAF1FF", None),
    ("p17", "Sabão em Pó", "Limpeza", "1 kg", "🧼", "#EAF1FF", None),
    ("p18", "Papel Higiênico", "Higiene", "12 rolos", "🧻", "#F4F7FB", None),
    ("p19", "Creme Dental", "Higiene", "90 g", "🪥", "#F4F7FB", None),
    ("p20", "Pizza Congelada", "Congelados", "460 g", "🍕", "#FDECEC", None),
]

# Preços base por produto e fatores por mercado (igual ao mock).
BASE_PRICES: dict[str, float] = {
    "p1": 5.49, "p2": 8.9, "p3": 3.49, "p4": 64.9, "p5": 18.9,
    "p6": 14.9, "p7": 5.29, "p8": 27.9, "p9": 12.5, "p10": 27.9,
    "p11": 8.49, "p12": 15.9, "p13": 4.29, "p14": 8.99, "p15": 7.49,
    "p16": 2.99, "p17": 12.9, "p18": 23.9, "p19": 4.49, "p20": 19.9,
}
MARKET_FACTOR: dict[str, float] = {
    "giassi": 1.0,
    "angeloni": 1.06,
    "bistek": 0.94,
    "comper": 0.99,
}


def _barcode(index: int) -> str:
    """Mesmo EAN determinístico do mock: '789' + (1_000_000_000 + i)."""
    return f"789{1_000_000_000 + index}"


def _round2(value: float) -> float:
    """Replica Math.round(x*100)/100 do JS (half-up)."""
    return math.floor(value * 100 + 0.5) / 100


def seed() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            print("Seed: dados já existem — nada a fazer.")
            return

        # Mercados
        for market_id, name, color in MARKETS:
            db.add(Market(id=market_id, name=name, brand_color=color))

        # Produtos
        for i, (pid, name, category, unit, emoji, bg, brand) in enumerate(CATALOG):
            db.add(
                Product(
                    id=pid,
                    name=name,
                    category=category,
                    unit=unit,
                    image_url=_placeholder(emoji, bg),
                    brand=brand,
                    barcode=_barcode(i),
                )
            )

        # Preços (um por produto × mercado)
        for pid, *_ in CATALOG:
            base = BASE_PRICES.get(pid, 9.9)
            for market_id, factor in MARKET_FACTOR.items():
                db.add(
                    Price(
                        product_id=pid,
                        market_id=market_id,
                        value=_round2(base * factor),
                        source="crowd",
                        updated_at=SEED_UPDATED_AT,
                    )
                )

        # Conta de demonstração (mesma do mock de auth do front).
        if db.query(User).filter(User.email == "demo@listasmart.com").first() is None:
            db.add(
                User(
                    name="Demonstração",
                    email="demo@listasmart.com",
                    password_hash=hash_password("12345678"),
                )
            )

        db.commit()
        print(
            f"Seed concluído: {len(MARKETS)} mercados, {len(CATALOG)} produtos, "
            f"{len(CATALOG) * len(MARKET_FACTOR)} preços, 1 usuário demo."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
