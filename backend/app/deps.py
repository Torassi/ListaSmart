"""Dependências reutilizáveis das rotas (autenticação)."""
from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.errors import UnauthorizedError
from app.models import User
from app.security import decode_access_token


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Protege rotas privadas: exige cookie de sessão válido e usuário existente."""
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise UnauthorizedError("Faça login para continuar.")

    user_id = decode_access_token(token)
    user = db.get(User, user_id)
    if user is None:
        raise UnauthorizedError("Sessão inválida ou expirada.")
    return user
