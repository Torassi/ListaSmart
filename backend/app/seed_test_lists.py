r"""Seed de listas de compras de teste para uma conta existente.

Insere algumas listas já preenchidas (com itens) vinculadas ao usuário informado
por e-mail, útil para testar a aplicação com dados realistas sem precisar montar
tudo pela interface.

Uso (PowerShell, a partir de backend/):
    .\.venv\Scripts\python.exe -m app.seed_test_lists teste@gmail.com

É idempotente: listas com o mesmo nome para o mesmo usuário não são duplicadas.
O dono é adicionado como colaborador (mesma regra da rota POST /lists).
"""
from __future__ import annotations

import sys

from app.database import SessionLocal
from app.models import ListItem, Product, ShoppingList, User

# Listas de teste: nome -> [(product_id, quantidade), ...].
TEST_LISTS: dict[str, list[tuple[str, int]]] = {
    "Compra do mês": [
        ("p10", 1),  # Arroz Branco
        ("p11", 2),  # Feijão Preto
        ("p7", 6),   # Leite Integral
        ("p9", 2),   # Ovos Brancos
        ("p12", 1),  # Café Torrado
        ("p13", 3),  # Macarrão Espaguete
    ],
    "Churrasco fim de semana": [
        ("p4", 2),   # Picanha Bovina
        ("p5", 1),   # Peito de Frango
        ("p6", 1),   # Pão Francês
        ("p14", 3),  # Refrigerante Cola
    ],
    "Limpeza & higiene": [
        ("p16", 2),  # Detergente Neutro
        ("p17", 1),  # Sabão em Pó
        ("p18", 1),  # Papel Higiênico
        ("p19", 3),  # Creme Dental
    ],
}


def seed_test_lists(email: str) -> None:
    normalized = email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == normalized).first()
        if user is None:
            raise SystemExit(
                f"Usuário '{normalized}' não encontrado. Cadastre-se primeiro "
                "ou informe um e-mail existente."
            )

        # Pré-carrega os produtos referenciados para validar os ids do seed.
        product_ids = {pid for items in TEST_LISTS.values() for pid, _ in items}
        products = {
            p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()
        }
        missing = product_ids - set(products)
        if missing:
            raise SystemExit(
                f"Produtos ausentes no catálogo: {sorted(missing)}. "
                "Rode `python -m app.seed` antes."
            )

        created = 0
        for name, items in TEST_LISTS.items():
            exists = (
                db.query(ShoppingList)
                .filter(ShoppingList.owner_id == user.id, ShoppingList.name == name)
                .first()
            )
            if exists is not None:
                continue  # idempotente: não duplica

            shopping_list = ShoppingList(name=name, owner_id=user.id)
            shopping_list.collaborators.append(user)  # dono é colaborador por padrão
            shopping_list.items = [
                ListItem(product_id=pid, quantity=qty) for pid, qty in items
            ]
            db.add(shopping_list)
            created += 1

        db.commit()
        print(
            f"Seed de listas concluído para {normalized}: "
            f"{created} lista(s) criada(s), {len(TEST_LISTS) - created} já existia(m)."
        )
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python -m app.seed_test_lists <email>")
    seed_test_lists(sys.argv[1])
