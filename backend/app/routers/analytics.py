"""Rotas do dashboard de inteligência (privadas).

- `GET /analytics`: indicadores agregados (dados reais; ver services/analytics).
- `POST /analytics/search-events`: registra um evento de busca para alimentar o
  ranking de produtos/categorias mais pesquisados.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.errors import AppError
from app.models import Product, SearchEvent, User
from app.schemas import AnalyticsData, SearchEventInput
from app.services.analytics import build_analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsData)
def get_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AnalyticsData:
    return build_analytics(db, user)


@router.post("/search-events", status_code=status.HTTP_201_CREATED)
def register_search_event(
    payload: SearchEventInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    """Registra um evento de busca (produto/categoria/termo)."""
    category = payload.category.strip() if payload.category else None
    product_id = payload.product_id.strip() if payload.product_id else None

    if not (product_id or category or payload.query):
        raise AppError("Evento de busca vazio.", code="empty_search_event", status_code=422)

    # Só vincula o produto se ele existir (evita FK inválida).
    if product_id and db.get(Product, product_id) is None:
        product_id = None

    db.add(
        SearchEvent(
            user_id=user.id,
            product_id=product_id,
            category=category,
            query=payload.query,
        )
    )
    db.commit()
    return {"ok": True}
