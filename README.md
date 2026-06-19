# Lista Smart

Plataforma web de **listas de compras colaborativas** com foco em **economia** e
**comparação de preços** entre supermercados da região (ex.: Giassi, Angeloni,
Bistek, Comper).

Aplicação **full-stack integrada**: o front-end consome a API real, que persiste
tudo em SQLite. Apenas alguns widgets de inteligência continuam em mock (ver
[O que permanece em mock](#o-que-permanece-em-mock)).

---

## Arquitetura atual

- **Front-end:** React + Vite + TypeScript (strict) + **TanStack Query** (estado de servidor) e Context API (estado de UI).
- **Back-end:** Python + **FastAPI** + **SQLAlchemy 2.0**.
- **Banco de dados:** **SQLite** (`backend/listasmart.db`).
- **Evolução do banco:** **Alembic** (única fonte de criação/evolução do schema).
- **Autenticação:** **JWT** assinado, entregue em **cookie httpOnly** (o token nunca chega ao JavaScript).
- **Segurança:** proteção **CSRF** por **double-submit cookie** (header `X-CSRF-Token` em métodos que alteram estado), hash de senha com **bcrypt**, cookie `SameSite`/`Secure` configuráveis.
- **Integrado à API:** autenticação, produtos/catálogo, preços, listas e comparação vêm do SQLite via API.
- **Ainda em mock / armazenamento local:** analytics, favoritos, economia recente e algumas preferências de perfil (região/mercados favoritos em `localStorage`).

Outras libs: React Router, Tailwind CSS v3, react-hook-form + zod, Recharts, lucide-react, ESLint + Prettier, Vitest + Testing Library (front); Pydantic v2, passlib + bcrypt, PyJWT (back).

---

## Pré-requisitos

- **Node 18+** e **npm**
- **Python 3.11+** (o SQLite vem embutido no Python via módulo `sqlite3` — **não precisa instalar separadamente**)

---

## Configuração do front-end (PowerShell)

```powershell
cd C:\Users\User\Desktop\ListaSmart
Copy-Item .env.example .env
npm install
npm.cmd run dev
```

- Front-end: **http://localhost:5173**
- O `.env` do front aponta para a API: `VITE_API_BASE_URL=http://localhost:8000/api`

---

## Configuração do back-end (PowerShell)

```powershell
cd C:\Users\User\Desktop\ListaSmart\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

> **Sobre ativar a venv:** caso `.\.venv\Scripts\Activate.ps1` não exista (ou a
> Execution Policy do PowerShell bloqueie scripts), **não é necessário ativar** o
> ambiente virtual. Basta chamar os executáveis da venv diretamente:
>
> - `.\.venv\Scripts\python.exe`
> - `.\.venv\Scripts\alembic.exe`

### SECRET_KEY (obrigatória)

O back-end **recusa iniciar** enquanto `SECRET_KEY` estiver vazia, com valor de
exemplo ou muito curta. Gere um valor forte:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copie o resultado e **substitua manualmente** o valor de `SECRET_KEY` em
`backend\.env`. O `backend\.env.example` traz apenas um **placeholder** e deixa
claro que ele precisa ser trocado.

### Banco SQLite (ordem correta)

```powershell
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.seed
```

- **Alembic** é a **única fonte** de criação e evolução do schema (`alembic upgrade head` cria todas as tabelas a partir de um banco inexistente).
- O **seed** **não cria tabelas** — apenas insere os dados iniciais (usuário demo, mercados, catálogo e preços). É **idempotente**: rodar de novo não duplica nada.
- O arquivo gerado é **`backend/listasmart.db`**.
- **SQLite não precisa ser instalado** separadamente (usa o `sqlite3` do Python).
- **Não versionar:** `.env`, `.venv`, `*.db`, `node_modules` e `dist`.

### Recriação do banco em desenvolvimento

Quando o schema mudar e o banco local **não** tiver dados importantes:

```powershell
Remove-Item .\listasmart.db -ErrorAction SilentlyContinue
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.seed
```

> ⚠️ **Não** faça isso em produção nem quando houver dados importantes — apague o
> banco apenas em desenvolvimento descartável.

---

## Execução

**Back-end** (um terminal):

```powershell
cd C:\Users\User\Desktop\ListaSmart\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

**Front-end** (outro terminal):

```powershell
cd C:\Users\User\Desktop\ListaSmart
npm.cmd run dev
```

URLs:

- Aplicação: **http://localhost:5173**
- API: **http://localhost:8000**
- Swagger (docs): **http://localhost:8000/docs**
- Healthcheck: **http://localhost:8000/api/health**

> Use **sempre `localhost`** em ambos (front e API). Não misture `localhost` com
> `127.0.0.1`: para o navegador são origens diferentes, e essa mistura quebra
> **CORS** e o envio do **cookie** de sessão.

### Conta de demonstração

Criada pelo seed:

- **E-mail:** `demo@listasmart.com`
- **Senha:** `12345678`

---

## Endpoints (todos sob o prefixo `/api`)

**Autenticação**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/signup` | Cadastro (define cookie de sessão + CSRF) |
| POST | `/api/auth/login` | Login (define cookie de sessão + CSRF) |
| POST | `/api/auth/logout` | Logout (limpa os cookies) |
| GET | `/api/auth/me` | Usuário autenticado (reidrata a sessão) |
| PATCH | `/api/auth/me` | Edição básica do perfil (`name`, `avatarUrl`) |

**Catálogo**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products` | Catálogo; filtros `q`, `category`, `barcode` |
| GET | `/api/products/{id}` | Produto por id |
| POST | `/api/products` | Cadastro manual de produto (+ preço inicial); requer auth |
| GET | `/api/categories` | Categorias distintas |
| GET | `/api/markets` | Supermercados |

**Preços**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/prices/matrix` | Matriz de preços (`productId`/`marketId` opcionais) |
| POST | `/api/prices` | Registrar/atualizar preço manual; requer auth |

**Listas** (todas requerem autenticação e validam a propriedade da lista)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/lists` | Listas do usuário (ordenadas por atividade recente) |
| POST | `/api/lists` | Criar lista |
| GET | `/api/lists/{id}` | Buscar lista por id |
| PATCH | `/api/lists/{id}` | Renomear lista |
| DELETE | `/api/lists/{id}` | Excluir lista |
| POST | `/api/lists/{id}/items` | Adicionar produto à lista |
| PATCH | `/api/lists/{id}/items/{productId}` | Alterar quantidade |
| DELETE | `/api/lists/{id}/items/{productId}` | Remover item |
| DELETE | `/api/lists/{id}/items` | Limpar a lista |
| GET | `/api/lists/{id}/comparison` | Comparar a lista entre supermercados |

> Mutações autenticadas exigem o header **`X-CSRF-Token`** (o front lê o cookie
> CSRF e o reenvia automaticamente). Editar itens atualiza `ShoppingList.updated_at`.

---

## Comparação de preços

- Cada mercado recebe um total e um marcador de **cobertura**: mercados **sem preço para todos os itens** da lista são marcados com **cobertura incompleta** (`complete: false`).
- **Somente mercados com cobertura completa** disputam o **mais barato** e o **mais caro**.
- A **economia** (`savedAmount`) é calculada **apenas entre mercados completos** — um mercado com preços parciais nunca é apontado como o mais barato.

---

## Segurança

- **JWT em cookie httpOnly** — o token nunca é exposto ao JavaScript (mitiga XSS); o front usa `credentials: 'include'`.
- **CSRF (double-submit cookie):** o servidor emite um cookie CSRF legível pelo JS; o front o reenvia no header `X-CSRF-Token` em toda requisição que altera estado. Mutações autenticadas sem o token são rejeitadas (403).
- **Senhas** com **bcrypt** (passlib); nunca em texto puro.
- **`SECRET_KEY` obrigatória** via ambiente — a aplicação falha ao iniciar se ausente/fraca/de exemplo.
- **Cookie configurável:** `COOKIE_SECURE`, `COOKIE_SAMESITE`, `COOKIE_NAME` (em produção HTTPS: `COOKIE_SECURE=true`; domínios distintos: `COOKIE_SAMESITE=none`).
- **Propriedade das listas** validada em todas as operações privadas (um usuário nunca acessa lista de outro).
- **Validação com zod** no front é só UX; o servidor (Pydantic + constraints no banco) é a fonte de verdade.
- Pontos sensíveis estão marcados no código com comentários `SECURITY:`.

---

## O que permanece em mock

Intencionalmente ainda **não** integrados à API (continuam em mock/armazenamento local):

- **Analytics** (dashboard de inteligência) — `src/services/analytics.ts`
- **Economia recente** e **favoritos** da Home — `src/services/home.ts`
- **Preferências de perfil** (região e mercados favoritos) — `localStorage` em `src/features/profile/PreferencesContext.tsx`

> `src/services/auth.ts` é um mock **legado** mantido apenas como referência/para
> seu próprio teste — o app usa `src/services/api/auth.ts` (JWT em cookie httpOnly).

---

## Testes

**Front-end:**

```powershell
cd C:\Users\User\Desktop\ListaSmart
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd audit --audit-level=high --omit=dev
```

**Back-end:**

```powershell
cd C:\Users\User\Desktop\ListaSmart\backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall app tests
.\.venv\Scripts\alembic.exe upgrade head
```

Os testes do back-end usam um **SQLite temporário/isolado** (não tocam o banco de
dev). Os testes do front exercitam o caminho real contexto → service → `fetch`
contra um **fake backend em memória** (`src/test/fakeBackend.ts`).

---

## CI

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em cada push/PR na `main` e valida:

- **Front-end:** lint, typecheck, testes, build e **auditoria de dependências** (`npm audit --audit-level=high`).
- **Back-end:** testes (`pytest`), **compilação** (`compileall`) e **migrations** (`alembic upgrade head` em um SQLite temporário).

---

## Estrutura

```
ListaSmart/
├── src/                      # front-end (React + Vite + TS)
│   ├── app/                  # shell, rotas, providers, ProtectedRoute
│   ├── components/           # Design System
│   ├── features/             # auth, home, list, compare, analytics, profile, catalog
│   ├── hooks/                # useToast, useDebounce
│   ├── services/             # services integrados (api/) + mocks remanescentes (analytics, home)
│   │   └── api/              # cliente real: auth, catalog, lists, prices, comparison
│   ├── lib/                  # cn, moeda, validação (zod), comparação, preços
│   ├── test/                 # setup + fake backend dos testes
│   └── types/                # contratos compartilhados (espelham o back-end)
├── backend/                  # API (FastAPI + SQLAlchemy + SQLite) — ver backend/README.md
└── .github/workflows/ci.yml  # CI (front + back)
```
