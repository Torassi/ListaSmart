"""Proteção CSRF para requisições autenticadas que alteram estado.

Esquema *double-submit cookie*:

- No login/cadastro o servidor define dois cookies: a sessão (httpOnly, ilegível
  ao JS) e um cookie CSRF legível pelo JS (`csrf_cookie_name`).
- O front lê o cookie CSRF e o reenvia no header `X-CSRF-Token` em toda
  requisição que altera estado (POST/PUT/PATCH/DELETE).
- O middleware abaixo só exige o token quando há cookie de SESSÃO presente
  (ou seja, requisições autenticadas). Assim, login/cadastro — feitos sem sessão
  — não precisam do token, e o restante fica protegido.

Por que funciona: um site malicioso pode forçar o navegador a enviar o cookie de
sessão, mas NÃO consegue ler o cookie CSRF (mesma-origem) para preencher o header
— então o token enviado não bate com o cookie e a requisição é rejeitada.
"""
from __future__ import annotations

import secrets

from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.config import settings

SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS", "TRACE"})
CSRF_HEADER = "x-csrf-token"


class CSRFMiddleware:
    """Bloqueia requisições autenticadas e mutáveis sem token CSRF válido."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive=receive)
        if not self._is_allowed(request):
            response = JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "code": "csrf_failed",
                        "message": "Token CSRF ausente ou inválido.",
                    }
                },
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)

    @staticmethod
    def _is_allowed(request: Request) -> bool:
        if request.method in SAFE_METHODS:
            return True

        session = request.cookies.get(settings.cookie_name)
        if not session:
            # Sem sessão (ex.: login/cadastro): não há o que proteger via CSRF.
            return True

        cookie_token = request.cookies.get(settings.csrf_cookie_name)
        header_token = request.headers.get(CSRF_HEADER)
        if not cookie_token or not header_token:
            return False
        return secrets.compare_digest(cookie_token, header_token)
