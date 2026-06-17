# Lista Smart — Backend (MVP)

API em **FastAPI + SQLAlchemy + SQLite** que suporta o fluxo principal do Lista
Smart: usuários, catálogo, listas de compras, preços e comparação entre
supermercados.

Os contratos de resposta espelham os tipos do front-end em
[`src/types/index.ts`](../src/types/index.ts) (`User`, `Product`, `Market`,
`Price`, `ShoppingList`, `ListItem`, `PriceMatrix`, `ListComparison`). As
respostas usam **camelCase** para casar diretamente com o front.

> **Fora do escopo deste MVP** (não implementado de propósito): analytics
> (`GET /analytics`), economia recente (`GET /savings/recent`), dashboard de
> inteligência, notificações, cupom fiscal, leitura real de código de barras e
> funcionamento offline.

## Stack

- **FastAPI** — rotas e validação
- **SQLAlchemy 2.0** — ORM
- **Alembic** — migrations
- **SQLite** — banco de desenvolvimento local
- **Pydantic v2** — schemas/validação
- **passlib + bcrypt** — hash de senha
- **PyJWT** — token de sessão (em cookie httpOnly)

## Autenticação

Sessão por **cookie httpOnly** contendo um **JWT** assinado. É a opção mais
simples e segura para o front (que usa `fetch(..., { credentials: 'include' })`):
o token nunca é exposto ao JavaScript, mitigando roubo via XSS.

- `login`/`signup` definem o cookie de sessão e retornam o perfil (`User`).
- Rotas privadas leem o cookie via dependência `get_current_user`.
- Em produção, configure `COOKIE_SECURE=true` (HTTPS) e, se front e API ficarem
  em domínios diferentes, `COOKIE_SAMESITE=none`.

## Como rodar o backend

Pré-requisito: **Python 3.11+**.

```bash
cd backend

# 1. Ambiente virtual
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

# 2. Dependências
pip install -r requirements.txt

# 3. Variáveis de ambiente
cp .env.example .env        # Windows: copy .env.example .env
#   -> gere um SECRET_KEY forte:
#      python -c "import secrets; print(secrets.token_urlsafe(48))"

# 4. Criar o schema + popular catálogo/mercados/preços mockados + usuário demo
python -m app.seed

# 5. Subir a API (http://localhost:8000)
uvicorn app.main:app --reload
```

- Documentação interativa (Swagger): http://localhost:8000/docs
- Healthcheck: http://localhost:8000/api/health
- Conta de demonstração criada pelo seed: **demo@listasmart.com** / **12345678**

### Migrations (Alembic) — opcional

O `python -m app.seed` já cria as tabelas (via `create_all`), então o Alembic é
opcional no dev. Para usar migrations explicitamente:

```bash
alembic upgrade head      # aplica o schema a partir das migrations
python -m app.seed        # popula os dados (create_all vira no-op)

# ao alterar modelos, gere uma nova migration:
alembic revision --autogenerate -m "descricao"
```

## Endpoints (todos sob o prefixo `/api`)

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/auth/signup` | — | Cadastro (define cookie de sessão) |
| POST | `/auth/login` | — | Login (define cookie de sessão) |
| POST | `/auth/logout` | — | Logout (limpa o cookie) |
| GET | `/auth/me` | ✓ | Usuário autenticado |
| PATCH | `/auth/me` | ✓ | Edição básica do perfil (`name`, `avatarUrl`) |
| GET | `/products` | — | Catálogo; filtros `q`, `category`, `barcode` |
| GET | `/products/{id}` | — | Produto por id |
| GET | `/categories` | — | Categorias distintas |
| GET | `/markets` | — | Supermercados |
| GET | `/prices/matrix` | — | Matriz de preços (`productId`/`marketId` opcionais) |
| POST | `/prices` | ✓ | Registrar/atualizar preço manual |
| GET | `/lists` | ✓ | Listas do usuário |
| POST | `/lists` | ✓ | Criar lista |
| GET | `/lists/{id}` | ✓ | Buscar lista por id |
| PATCH | `/lists/{id}` | ✓ | Renomear lista |
| DELETE | `/lists/{id}` | ✓ | Excluir lista |
| POST | `/lists/{id}/items` | ✓ | Adicionar produto à lista |
| PATCH | `/lists/{id}/items/{productId}` | ✓ | Alterar quantidade |
| DELETE | `/lists/{id}/items/{productId}` | ✓ | Remover item |
| DELETE | `/lists/{id}/items` | ✓ | Limpar lista |
| GET | `/lists/{id}/comparison` | ✓ | Comparar lista entre supermercados |

## Tratamento de erros

Todas as respostas de erro seguem o formato padronizado, sem vazar detalhes
internos:

```json
{ "error": { "code": "invalid_credentials", "message": "E-mail ou senha incorretos." } }
```

## Testes

```bash
cd backend
pip install -r requirements.txt
pytest
```

Os testes usam um SQLite em memória isolado (não tocam no banco de dev) e cobrem
o fluxo principal: auth, catálogo/busca, CRUD de listas e itens, preços e
comparação.

## Estrutura

```
backend/
├── app/
│   ├── main.py            # cria o app, CORS, handlers de erro, rotas
│   ├── config.py          # settings via .env (pydantic-settings)
│   ├── database.py        # engine, Session, Base
│   ├── security.py        # hash de senha + JWT
│   ├── deps.py            # get_current_user (proteção de rotas)
│   ├── errors.py          # erros de domínio + respostas padronizadas
│   ├── seed.py            # popula catálogo/mercados/preços (mock do front)
│   ├── models/            # modelos SQLAlchemy
│   ├── schemas/           # schemas Pydantic (contratos camelCase)
│   ├── routers/           # auth, catalog, lists, prices, comparison
│   └── services/          # lógica de comparação de preços
├── alembic/               # migrations
├── tests/                 # pytest
├── requirements.txt
└── .env.example
```
