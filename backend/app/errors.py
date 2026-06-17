"""Tratamento padronizado de erros.

Toda resposta de erro segue o formato:

    {"error": {"code": "<slug>", "message": "<mensagem amigável>"}}

Isso evita vazar stack traces/detalhes internos ao cliente e dá ao front-end
uma forma consistente de exibir mensagens.
"""
from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    """Erro de domínio com código e status HTTP padronizados."""

    def __init__(self, message: str, *, code: str = "error", status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso não encontrado.", *, code: str = "not_found") -> None:
        super().__init__(message, code=code, status_code=status.HTTP_404_NOT_FOUND)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflito de dados.", *, code: str = "conflict") -> None:
        super().__init__(message, code=code, status_code=status.HTTP_409_CONFLICT)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Não autenticado.", *, code: str = "unauthorized") -> None:
        super().__init__(message, code=code, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Acesso negado.", *, code: str = "forbidden") -> None:
        super().__init__(message, code=code, status_code=status.HTTP_403_FORBIDDEN)


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


def register_error_handlers(app: FastAPI) -> None:
    """Registra os handlers que padronizam o corpo das respostas de erro."""

    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message)

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "Erro na requisição."
        return _error_response(exc.status_code, "http_error", detail)

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Mostra a primeira falha de validação de forma legível.
        first = exc.errors()[0] if exc.errors() else None
        if first:
            field = ".".join(str(p) for p in first.get("loc", []) if p != "body")
            message = first.get("msg", "Dados inválidos.")
            message = f"{field}: {message}" if field else message
        else:
            message = "Dados inválidos."
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "validation_error", message
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception) -> JSONResponse:  # noqa: ARG001
        # Não vaza detalhes internos ao cliente.
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "internal_error",
            "Ocorreu um erro inesperado.",
        )
