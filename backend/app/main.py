"""Ponto de entrada da API do Lista Smart (FastAPI).

Monta a aplicação, configura CORS para o front, registra os handlers de erro
padronizados e inclui as rotas sob o prefixo `/api`.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.errors import register_error_handlers
from app.routers import auth, catalog, comparison, lists, prices

app = FastAPI(
    title="Lista Smart API",
    version="0.1.0",
    description="Backend MVP do Lista Smart (usuários, catálogo, listas, preços e comparação).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,  # necessário para o cookie de sessão httpOnly
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(catalog.router, prefix=API_PREFIX)
app.include_router(lists.router, prefix=API_PREFIX)
app.include_router(prices.router, prefix=API_PREFIX)
app.include_router(comparison.router, prefix=API_PREFIX)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
