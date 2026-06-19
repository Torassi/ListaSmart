"""Configuração da aplicação carregada do ambiente (.env).

Usa pydantic-settings para validar e tipar as variáveis de ambiente. Tudo que
for segredo ou específico de ambiente (banco, chave do JWT, CORS) vem daqui.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Valores de exemplo/placeholder que NUNCA podem ir para produção: se a
# SECRET_KEY for um destes (ou estiver vazia), a aplicação se recusa a subir.
INSECURE_SECRETS = frozenset(
    {
        "dev-secret-change-me",
        "troque-este-segredo-em-producao",
        "change-me",
        "changeme",
        "secret",
    }
)
MIN_SECRET_LENGTH = 16


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Banco
    database_url: str = "sqlite:///./listasmart.db"

    # Autenticação / JWT — SECRET_KEY é OBRIGATÓRIA e não tem valor padrão.
    # A aplicação falha ao iniciar se não for definida (ver validador abaixo).
    secret_key: str
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 dias
    jwt_algorithm: str = "HS256"

    # Cookie de sessão (httpOnly)
    cookie_name: str = "listasmart_session"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"  # lax | strict | none

    # Cookie anti-CSRF (legível pelo JS p/ double-submit; ver middleware CSRF).
    csrf_cookie_name: str = "listasmart_csrf"

    @field_validator("secret_key")
    @classmethod
    def _validate_secret(cls, value: str) -> str:
        """Falha rápido (no boot) se a SECRET_KEY for fraca ou de exemplo."""
        cleaned = (value or "").strip()
        if not cleaned:
            raise ValueError(
                "SECRET_KEY é obrigatória. Defina um valor forte no ambiente "
                "(.env). Gere com: python -c \"import secrets; "
                'print(secrets.token_urlsafe(48))"'
            )
        if cleaned in INSECURE_SECRETS or cleaned.lower() in INSECURE_SECRETS:
            raise ValueError(
                "SECRET_KEY ainda está com um valor de exemplo. Defina um "
                "segredo único e forte antes de iniciar a aplicação."
            )
        if len(cleaned) < MIN_SECRET_LENGTH:
            raise ValueError(
                f"SECRET_KEY muito curta (mínimo {MIN_SECRET_LENGTH} caracteres)."
            )
        return value

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
