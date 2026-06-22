"""Rota de economias recentes da Home (privada).

Baseada nos snapshots de comparação registrados pelo usuário — não há dados
fictícios: sem snapshots, a lista volta vazia.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import ComparisonSnapshot, Market, User
from app.schemas import SavingsSummary

router = APIRouter(prefix="/savings", tags=["savings"])

RECENT_LIMIT = 10


@router.get("/recent", response_model=list[SavingsSummary])
def recent_savings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[SavingsSummary]:
    market_name = {
        m.id: m.name for m in db.execute(select(Market)).scalars().all()
    }

    snapshots = (
        db.execute(
            select(ComparisonSnapshot)
            .where(ComparisonSnapshot.user_id == user.id)
            .order_by(ComparisonSnapshot.created_at.desc())
            .limit(RECENT_LIMIT)
        )
        .scalars()
        .all()
    )

    return [
        SavingsSummary(
            id=str(s.id),
            list_name=s.list_name,
            cheapest_market=market_name.get(s.cheapest_market_id or "", "—"),
            total=s.cheapest_total,
            saved_amount=s.saved_amount,
            date=s.created_at,
        )
        for s in snapshots
    ]
