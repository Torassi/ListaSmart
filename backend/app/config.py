"""Configuração da aplicação carregada do ambiente (.env).

Usa pydantic-settings para validar e tipar as variáveis de ambiente. Tudo que
for segredo ou específico de ambiente (banco, chave do JWT, CORS) vem daqui.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Banco
    database_url: str = "sqlite:///./listasmart.db"

    # Autenticação / JWT
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 dias
    jwt_algorithm: str = "HS256"

    # Cookie de sessão (httpOnly)
    cookie_name: str = "listasmart_session"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"  # lax | strict | none

    # CORS — aceita string separada por vírgulas no env (NoDecode evita o
    # parse JSON automático do pydantic-settings para campos do tipo lista).
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        """Permite definir CORS_ORIGINS como string separada por vírgulas."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Retorna a configuração (cacheada) da aplicação."""
    return Settings()


settings = get_settings()
