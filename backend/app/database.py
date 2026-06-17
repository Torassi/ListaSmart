"""Configuração do SQLAlchemy: engine, sessão e Base declarativa."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# `check_same_thread` só é relevante (e necessário) para SQLite + FastAPI.
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Base declarativa compartilhada por todos os modelos."""


def get_db() -> Generator[Session, None, None]:
    """Dependência FastAPI: abre uma sessão por requisição e fecha ao final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
