"""Schemas de usuário (contrato `User` do front)."""
from __future__ import annotations

from pydantic import Field

from app.schemas.common import CamelModel


class UserOut(CamelModel):
    """Espelha `User` de src/types/index.ts."""

    id: str
    name: str
    email: str
    avatar_url: str | None = None


class UpdateProfileInput(CamelModel):
    """Edição básica de perfil. Apenas campos do contrato `User`."""

    name: str | None = Field(default=None, min_length=2, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=2048)
