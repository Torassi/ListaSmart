"""Comparação de preços de uma lista e registro de snapshots (privadas)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.errors import AppError, NotFoundError
from app.models import ComparisonSnapshot, Market, Price, ShoppingList, User
from app.schemas import ComparisonSnapshotOut, ListComparison
from app.services.comparison import build_comparison

router = APIRouter(prefix="/lists", tags=["comparison"])


def _owned_list(db: Session, list_id: str, user: User) -> ShoppingList:
    shopping_list = db.get(ShoppingList, list_id)
    if shopping_list is None or shopping_list.owner_id != user.id:
        raise NotFoundError("Lista não encontrada.")
    return shopping_list


def _price_matrix(db: Session) -> dict[str, dict[str, float]]:
    matrix: dict[str, dict[str, float]] = {}
    for price in db.execute(select(Price)).scalars().all():
        matrix.setdefault(price.product_id, {})[price.market_id] = price.value
    return matrix


@router.get("/{list_id}/comparison", response_model=ListComparison)
def compare_list(
    list_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ListComparison:
    """Compara a lista entre todos os mercados: totais, mais barato/caro e economia."""
    shopping_list = _owned_list(db, list_id, user)
    markets = db.execute(select(Market).order_by(Market.name)).scalars().all()
    return build_comparison(shopping_list, markets, _price_matrix(db))


@router.post(
    "/{list_id}/comparison-snapshots",
    response_model=ComparisonSnapshotOut,
    status_code=status.HTTP_201_CREATED,
)
def create_comparison_snapshot(
    list_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ComparisonSnapshot:
    """Finaliza a lista: registra UM snapshot (economia) e a marca como finalizada.

    Exige cobertura completa (ao menos um mercado com preço para todos os itens).
    É idempotente POR LISTA: se a lista já tem um snapshot, ele é devolvido sem
    duplicar dados no dashboard. Após finalizar, a lista não pode mais ser
    editada nem excluída.
    """
    shopping_list = _owned_list(db, list_id, user)

    # Idempotência por lista: um único snapshot por lista (evita duplicar economia).
    existing = db.execute(
        select(ComparisonSnapshot)
        .where(ComparisonSnapshot.shopping_list_id == shopping_list.id)
        .order_by(ComparisonSnapshot.created_at.desc())
    ).scalars().first()
    if existing is not None:
        if not shopping_list.finalized:
            shopping_list.finalized = True
            db.commit()
        return existing

    markets = db.execute(select(Market).order_by(Market.name)).scalars().all()
    comparison = build_comparison(shopping_list, markets, _price_matrix(db))

    if not comparison.cheapest_market_id:
        raise AppError(
            "Nenhum mercado tem preço para todos os itens — não é possível finalizar.",
            code="incomplete_coverage",
            status_code=400,
        )

    totals = {t.market_id: t.total for t in comparison.totals}
    cheapest_total = totals.get(comparison.cheapest_market_id, 0.0)
    most_expensive_total = totals.get(comparison.most_expensive_market_id, 0.0)

    snapshot = ComparisonSnapshot(
        user_id=user.id,
        shopping_list_id=shopping_list.id,
        list_name=shopping_list.name,
        cheapest_market_id=comparison.cheapest_market_id,
        most_expensive_market_id=comparison.most_expensive_market_id or None,
        cheapest_total=cheapest_total,
        most_expensive_total=most_expensive_total,
        saved_amount=comparison.saved_amount,
    )
    db.add(snapshot)
    # Finaliza a lista: entra no dashboard e fica bloqueada para edição/exclusão.
    shopping_list.finalized = True
    db.commit()
    db.refresh(snapshot)
    return snapshot
