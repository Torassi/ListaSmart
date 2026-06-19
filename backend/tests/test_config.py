"""Testes da configuração de segurança: SECRET_KEY obrigatória e forte."""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_missing_secret_key_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_example_secret_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(secret_key="dev-secret-change-me", _env_file=None)


def test_placeholder_secret_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(secret_key="troque-este-segredo-em-producao", _env_file=None)


def test_short_secret_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(secret_key="curta", _env_file=None)


def test_strong_secret_is_accepted() -> None:
    settings = Settings(
        secret_key="uma-chave-bem-forte-1234567890abcdef", _env_file=None
    )
    assert settings.secret_key
