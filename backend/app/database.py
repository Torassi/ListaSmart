"""Configuração do SQLAlchemy: engine, sessão e Base declarativa."""
from __future__ import annotations

import sqlite3
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# `check_same_thread` só é relevante (e necessário) para SQLite + FastAPI.
_is_sqlite = settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# SQLite desabilita a checagem de chaves estrangeiras por padrão
# (PRAGMA foreign_keys = OFF). Habilitamos em TODA conexão para que
# ON DELETE CASCADE / SET NULL funcionem e a integridade seja garantida.
@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection: object, _connection_record: object) -> None:
    # Aplica apenas a conexões SQLite (inclui o engine de testes em memória);
    # em outros bancos é no-op.
    if not isinstance(dbapi_connection, sqlite3.Connection):
        return
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
    finally:
        cursor.close()


class Base(DeclarativeBase):
    """Base declarativa compartilhada por todos os modelos."""


def get_db() -> Generator[Session, None, None]:
    """Dependência FastAPI: abre uma sessão por requisição e fecha ao final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
