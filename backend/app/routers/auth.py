"""Rotas de autenticação: cadastro, login, logout, perfil.

Sessão por cookie httpOnly contendo um JWT — opção simples e segura para o
front (que usa `credentials: 'include'`): o token nunca é exposto ao JavaScript,
mitigando roubo via XSS.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.errors import ConflictError, UnauthorizedError
from app.models import User
from app.schemas import LoginInput, SignupInput, UpdateProfileInput, UserOut
from app.security import (
    create_access_token,
    generate_csrf_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_session(response: Response, user_id: str) -> None:
    """Define a sessão (httpOnly) e o cookie CSRF (legível pelo JS)."""
    token = create_access_token(user_id)
    max_age = settings.access_token_expire_minutes * 60
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=max_age,
        path="/",
    )
    # Cookie CSRF: NÃO é httpOnly de propósito — o front precisa lê-lo para
    # reenviá-lo no header X-CSRF-Token (esquema double-submit).
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=generate_csrf_token(),
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=max_age,
        path="/",
    )


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupInput,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    normalized = payload.email.strip().lower()
    exists = db.query(User).filter(User.email == normalized).first()
    if exists is not None:
        raise ConflictError("Este e-mail já está cadastrado.", code="email_taken")

    user = User(
        name=payload.name.strip(),
        email=normalized,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _issue_session(response, user.id)
    return user


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginInput,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    normalized = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized).first()

    # Mensagem genérica: não revela se o e-mail existe.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("E-mail ou senha incorretos.", code="invalid_credentials")

    _issue_session(response, user.id)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    response.delete_cookie(key=settings.cookie_name, path="/")
    response.delete_cookie(key=settings.csrf_cookie_name, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
def me(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
) -> User:
    # Garante o cookie CSRF disponível ao front após reidratar a sessão (reload),
    # mas só o emite se ainda não existir — evita rotacionar o token a cada /me.
    if not request.cookies.get(settings.csrf_cookie_name):
        response.set_cookie(
            key=settings.csrf_cookie_name,
            value=generate_csrf_token(),
            httponly=False,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            max_age=settings.access_token_expire_minutes * 60,
            path="/",
        )
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: UpdateProfileInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url or None
    db.commit()
    db.refresh(current_user)
    return current_user
