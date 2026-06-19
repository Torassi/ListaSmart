# Lista Smart — Backend

API em **FastAPI + SQLAlchemy 2.0 + SQLite** que suporta o fluxo principal do
Lista Smart: usuários, catálogo, listas de compras, preços e comparação entre
supermercados. O schema evolui via **Alembic**.

Os contratos de resposta espelham os tipos do front-end em
[`src/types/index.ts`](../src/types/index.ts) (`User`, `Product`, `Market`,
`Price`, `ShoppingList`, `ListItem`, `PriceMatrix`, `ListComparison`). As
respostas usam **camelCase** para casar diretamente com o front.

> **Fora do escopo deste backend** (continuam em mock no front, de propósito):
> analytics, economia recente, favoritos, notificações, cupom fiscal, leitura
> real de código de barras e funcionamento offline.

## Stack

- **FastAPI** — rotas e validação
- **SQLAlchemy 2.0** — ORM
- **Alembic** — migrations (**única** fonte do schema)
- **SQLite** — banco local (`listasmart.db`), via módulo `sqlite3` do Python (não precisa instalar)
- **Pydantic v2** — schemas/validação
- **passlib + bcrypt** — hash de senha
- **PyJWT** — token de sessão (em cookie httpOnly)

## Autenticação e segurança

- Sessão por **cookie httpOnly** contendo um **JWT** assinado — o token nunca é exposto ao JavaScript (mitiga XSS). O front usa `fetch(..., { credentials: 'include' })`.
- `login`/`signup` definem o cookie de sessão **e** um cookie **CSRF**; retornam o perfil (`User`).
- **Proteção CSRF (double-submit cookie):** mutações autenticadas (POST/PUT/PATCH/DELETE) exigem o header `X-CSRF-Token` igual ao cookie CSRF (ver [`app/csrf.py`](app/csrf.py)). Sem isso → `403`.
- Rotas privadas leem o cookie via dependência `get_current_user`; operações de lista **validam a propriedade** (um usuário nunca acessa lista de outro).
- **`SECRET_KEY` é obrigatória**: a aplicação **recusa iniciar** se estiver ausente, com valor de exemplo ou muito curta (ver [`app/config.py`](app/config.py)).
- Cookie configurável: `COOKIE_SECURE` (use `true` em produção/HTTPS), `COOKIE_SAMESITE` (`none` se front e API ficarem em domínios diferentes), `COOKIE_NAME`.

## Como rodar (PowerShell)

Pré-requisito: **Python 3.11+**.

```powershell
cd C:\Users\User\Desktop\ListaSmart\backend

# 1. Ambiente virtual
python -m venv .venv

# 2. Dependências (chamando o python da venv diretamente)
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 3. Variáveis de ambiente
Copy-Item .env.example .env
```

> Se `.\.venv\Scripts\Activate.ps1` não existir (ou a Execution Policy bloquear),
> **não é preciso ativar** a venv: chame os executáveis diretamente —
> `.\.venv\Scripts\python.exe` e `.\.venv\Scripts\alembic.exe`.

### SECRET_KEY (obrigatória)

Gere um valor forte e **substitua manualmente** `SECRET_KEY` em `.env`:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

O `.env.example` traz apenas um **placeholder** — o backend não sobe enquanto ele
não for trocado.

### Banco de dados (ordem correta)

```powershell
.\.venv\Scripts\alembic.exe upgrade head    # cria/evolui o schema (única fonte)
.\.venv\Scripts\python.exe -m app.seed      # insere apenas os dados iniciais
```

- **Alembic** cria todas as tabelas a partir de um banco **inexistente**.
- O **seed não cria o schema** — só insere dados (usuário demo, mercados, catálogo e preços) e é **idempotente** (não duplica em reexecuções). Se as tabelas não existirem, ele orienta a rodar a migration antes.
- Arquivo gerado: **`backend/listasmart.db`**.

#### Recriar o banco em desenvolvimento (sem dados importantes)

```powershell
Remove-Item .\listasmart.db -ErrorAction SilentlyContinue
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.seed
```

> ⚠️ Não use em produção nem com dados importantes.

#### Evoluir o schema

Ao alterar os modelos, gere uma migration e aplique:

```powershell
.\.venv\Scripts\alembic.exe revision --autogenerate -m "descricao"
.\.venv\Scripts\alembic.exe upgrade head
```

### Subir a API

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Healthcheck: http://localhost:8000/api/health
- Conta de demonstração (seed): **demo@listasmart.com** / **12345678**

> Use sempre `localhost` (não misture com `127.0.0.1`) para não quebrar CORS/cookies.

## Endpoints (prefixo `/api`)

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/auth/signup` | — | Cadastro (define cookies de sessão + CSRF) |
| POST | `/auth/login` | — | Login (define cookies de sessão + CSRF) |
| POST | `/auth/logout` | — | Logout (limpa os cookies) |
| GET | `/auth/me` | ✓ | Usuário autenticado (reidrata a sessão) |
| PATCH | `/auth/me` | ✓ | Edição básica do perfil (`name`, `avatarUrl`) |
| GET | `/products` | — | Catálogo; filtros `q`, `category`, `barcode` |
| GET | `/products/{id}` | — | Produto por id |
| POST | `/products` | ✓ | Cadastro manual de produto (+ preço inicial) |
| GET | `/categories` | — | Categorias distintas |
| GET | `/markets` | — | Supermercados |
| GET | `/prices/matrix` | — | Matriz de preços (`productId`/`marketId` opcionais) |
| POST | `/prices` | ✓ | Registrar/atualizar preço manual |
| GET | `/lists` | ✓ | Listas do usuário (por atividade recente) |
| POST | `/lists` | ✓ | Criar lista |
| GET | `/lists/{id}` | ✓ | Buscar lista por id |
| PATCH | `/lists/{id}` | ✓ | Renomear lista |
| DELETE | `/lists/{id}` | ✓ | Excluir lista |
| POST | `/lists/{id}/items` | ✓ | Adicionar produto à lista |
| PATCH | `/lists/{id}/items/{productId}` | ✓ | Alterar quantidade |
| DELETE | `/lists/{id}/items/{productId}` | ✓ | Remover item |
| DELETE | `/lists/{id}/items` | ✓ | Limpar lista |
| GET | `/lists/{id}/comparison` | ✓ | Comparar lista entre supermercados |

> Mutações autenticadas exigem o header `X-CSRF-Token`. Adicionar/alterar/remover/
> limpar itens atualiza `ShoppingList.updated_at` (ordenação por atividade recente).

### Comparação de preços

- Mercados **sem preço para todos os itens** são marcados com **cobertura incompleta** (`complete: false`).
- **Somente mercados com cobertura completa** podem ser o **mais barato** ou o **mais caro**.
- A **economia** é calculada **apenas entre mercados completos**.

## Tratamento de erros

Respostas de erro padronizadas, sem vazar detalhes internos:

```json
{ "error": { "code": "invalid_credentials", "message": "E-mail ou senha incorretos." } }
```

## Testes

```powershell
cd C:\Users\User\Desktop\ListaSmart\backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall app tests
.\.venv\Scripts\alembic.exe upgrade head
```

Os testes usam um **SQLite em memória isolado** (não tocam o banco de dev) e
cobrem o fluxo principal: auth (com CSRF), catálogo/busca, cadastro de produto,
CRUD de listas e itens, `updated_at`, preços e comparação por cobertura.

## Estrutura

```
backend/
├── app/
│   ├── main.py            # cria o app, CORS, middleware CSRF, handlers de erro, rotas
│   ├── config.py          # settings via .env (pydantic-settings); SECRET_KEY obrigatória
│   ├── csrf.py            # middleware de proteção CSRF (double-submit cookie)
│   ├── database.py        # engine, Session, Base
│   ├── security.py        # hash de senha (bcrypt) + JWT + token CSRF
│   ├── deps.py            # get_current_user (proteção de rotas)
│   ├── errors.py          # erros de domínio + respostas padronizadas
│   ├── seed.py            # insere dados iniciais (NÃO cria o schema)
│   ├── models/            # modelos SQLAlchemy (timestamps, created_by, constraints)
│   ├── schemas/           # schemas Pydantic (contratos camelCase)
│   ├── routers/           # auth, catalog, products, lists, prices, comparison
│   └── services/          # lógica de comparação de preços
├── alembic/               # migrations (única fonte do schema)
├── tests/                 # pytest (SQLite isolado)
├── requirements.txt
└── .env.example
```

## Variáveis de ambiente

Ver [`.env.example`](.env.example). Resumo:

| Variável | Padrão | Observação |
|----------|--------|-----------|
| `DATABASE_URL` | `sqlite:///./listasmart.db` | Banco SQLite local |
| `SECRET_KEY` | — (placeholder) | **Obrigatória**; gere uma e substitua |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Validade do JWT (7 dias) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Origens do front |
| `COOKIE_NAME` | `listasmart_session` | Nome do cookie de sessão |
| `COOKIE_SECURE` | `false` | `true` em produção (HTTPS) |
| `COOKIE_SAMESITE` | `lax` | `none` se front/API em domínios distintos |

> `.env`, `.venv` e `*.db` **não** são versionados (ver `.gitignore`).
