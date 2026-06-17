"""Schemas de autenticação (login / cadastro)."""
from __future__ import annotations

from pydantic import EmailStr, Field

from app.schemas.common import CamelModel
from app.schemas.user import UserOut


class LoginInput(CamelModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class SignupInput(CamelModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class AuthResponse(CamelModel):
    """Resposta de login/cadastro: o perfil público do usuário.

    O token de sessão NÃO vai no corpo — ele é definido pelo servidor em um
    cookie httpOnly (ver routers/auth.py).
    """

    user: UserOut
