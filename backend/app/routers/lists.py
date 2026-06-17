"""Rotas de listas de compras (todas privadas — exigem autenticação).

Cada usuário só acessa/edita as próprias listas. As respostas seguem o contrato
`ShoppingList` (com itens e colaboradores embutidos).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.errors import NotFoundError
from app.models import ListItem, Product, ShoppingList, User
from app.schemas import (
    AddItemInput,
    CreateListInput,
    RenameListInput,
    ShoppingListOut,
    UpdateQuantityInput,
)

router = APIRouter(prefix="/lists", tags=["lists"])


def _get_owned_list(db: Session, list_id: str, user: User) -> ShoppingList:
    """Carrega uma lista garantindo que pertence ao usuário autenticado."""
    shopping_list = db.get(ShoppingList, list_id)
    if shopping_list is None or shopping_list.owner_id != user.id:
        # Mesma resposta para "não existe" e "não é sua" — não vaza existência.
        raise NotFoundError("Lista não encontrada.")
    return shopping_list


@router.get("", response_model=list[ShoppingListOut])
def list_lists(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ShoppingList]:
    stmt = (
        select(ShoppingList)
        .where(ShoppingList.owner_id == user.id)
        .order_by(ShoppingList.updated_at.desc())
    )
    return db.execute(stmt).scalars().all()


@router.post("", response_model=ShoppingListOut, status_code=status.HTTP_201_CREATED)
def create_list(
    payload: CreateListInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShoppingList:
    shopping_list = ShoppingList(name=payload.name.strip(), owner_id=user.id)
    shopping_list.collaborators.append(user)  # o dono é colaborador por padrão
    db.add(shopping_list)
    db.commit()
    db.refresh(shopping_list)
    return shopping_list


@router.get("/{list_id}", response_model=ShoppingListOut)
def get_list(
    list_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShoppingList:
    return _get_owned_list(db, list_id, user)


@router.patch("/{list_id}", response_model=ShoppingListOut)
def rename_list(
    list_id: str,
    payload: RenameListInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, list_id, user)
    shopping_list.name = payload.name.strip()
    db.commit()
    db.refresh(shopping_list)
    return shopping_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(
    list_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    shopping_list = _get_owned_list(db, list_id, user)
    db.delete(shopping_list)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{list_id}/items",
    response_model=ShoppingListOut,
    status_code=status.HTTP_201_CREATED,
)
def add_item(
    list_id: str,
    payload: AddItemInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, list_id, user)

    product = db.get(Product, payload.product_id)
    if product is None:
        raise NotFoundError("Produto não encontrado.")

    existing = next(
        (i for i in shopping_list.items if i.product_id == payload.product_id), None
    )
    if existing is not None:
        # Item já na lista: soma a quantidade (comportamento idempotente amigável).
        existing.quantity = min(existing.quantity + payload.quantity, 999)
    else:
        shopping_list.items.append(
            ListItem(product_id=payload.product_id, quantity=payload.quantity)
        )

    db.commit()
    db.refresh(shopping_list)
    return shopping_list


@router.patch("/{list_id}/items/{product_id}", response_model=ShoppingListOut)
def update_item_quantity(
    list_id: str,
    product_id: str,
    payload: UpdateQuantityInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, list_id, user)
    item = next((i for i in shopping_list.items if i.product_id == product_id), None)
    if item is None:
        raise NotFoundError("Item não encontrado na lista.")
    item.quantity = payload.quantity
    db.commit()
    db.refresh(shopping_list)
    return shopping_list


@router.delete("/{list_id}/items/{product_id}", response_model=ShoppingListOut)
def remove_item(
    list_id: str,
    product_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, list_id, user)
    item = next((i for i in shopping_list.items if i.product_id == product_id), None)
    if item is None:
        raise NotFoundError("Item não encontrado na lista.")
    shopping_list.items.remove(item)
    db.commit()
    db.refresh(shopping_list)
    return shopping_list


@router.delete("/{list_id}/items", response_model=ShoppingListOut)
def clear_list(
    list_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, list_id, user)
    shopping_list.items.clear()
    db.commit()
    db.refresh(shopping_list)
    return shopping_list
