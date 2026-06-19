"""Segurança: hash de senha (bcrypt/passlib), tokens JWT de sessão e CSRF."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.config import settings
from app.errors import UnauthorizedError

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_csrf_token() -> str:
    """Gera um token CSRF aleatório (usado no esquema double-submit cookie)."""
    return secrets.token_urlsafe(32)


def hash_password(password: str) -> str:
    """Gera o hash bcrypt da senha (nunca armazene a senha em texto puro)."""
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Compara a senha informada com o hash armazenado."""
    return _pwd_context.verify(password, password_hash)


def create_access_token(subject: str) -> str:
    """Cria um JWT assinado contendo o id do usuário (`sub`) e expiração."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    """Valida o JWT e devolve o `sub` (id do usuário). Lança 401 se inválido."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Sessão inválida ou expirada.") from exc

    subject = payload.get("sub")
    if not subject:
        raise UnauthorizedError("Sessão inválida ou expirada.")
    return str(subject)
