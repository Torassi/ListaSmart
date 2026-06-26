# ListaSmart

Plataforma full-stack de **listas de compras colaborativas** com foco em **economia**, comparação de preços entre supermercados e indicadores de inteligência.

O projeto possui:

- Front-end web em React + TypeScript + Vite;
- Back-end em FastAPI + SQLAlchemy + SQLite;
- Banco local SQLite gerenciado por Alembic;
- Autenticação com sessão em cookie httpOnly + proteção CSRF;
- Aplicação mobile demonstrativa com Expo + WebView, carregando o mesmo front-end web.

## Visão geral da arquitetura

```text
Navegador / WebView
        |
        | /api
        v
Vite dev server - http://localhost:5173 ou http://IP_DO_PC:5173
        |
        | proxy /api
        v
FastAPI - http://127.0.0.1:8000
        |
        v
SQLite - backend/listasmart.db
```

O front-end deve chamar a API usando URL relativa:

```env
VITE_API_BASE_URL=/api
```

Com isso, tanto o navegador do PC quanto a WebView no celular usam a mesma origem do front-end. O Vite encaminha `/api` para o FastAPI.

## Tecnologias

### Front-end

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Recharts
- Vitest + Testing Library

### Back-end

- Python
- FastAPI
- SQLAlchemy 2.0
- Alembic
- SQLite
- Pydantic
- PyJWT
- passlib + bcrypt
- Pytest

### Mobile demonstrativo

- Expo
- React Native
- React Native WebView

## Pré-requisitos

Instale no computador:

- Node.js 18 ou superior;
- npm;
- Python 3.11 ou superior;
- Git;
- Expo Go no celular, caso queira testar o mobile.

O SQLite não precisa ser instalado separadamente, pois o Python já inclui suporte via módulo `sqlite3`.

## Como rodar em um novo computador

Clone o repositório e entre na pasta:

```bat
git clone LINK_DO_REPOSITORIO
cd ListaSmart
```

Se você baixou o ZIP em vez de clonar, apenas extraia e entre na pasta do projeto.

## Configurar o front-end

Na raiz do projeto:

```bat
npm install
copy .env.example .env
```

Confira se o arquivo `.env` da raiz contém:

```env
VITE_API_BASE_URL=/api
```

Não coloque `localhost:8000` nem IP fixo nessa variável. Ela deve ficar como `/api`.

## Configurar o back-end

Entre na pasta do back-end:

```bat
cd backend
```

Crie a venv:

```bat
py -m venv .venv
```

Se `py` não funcionar, use:

```bat
python -m venv .venv
```

Instale as dependências:

```bat
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Crie o `.env` do back-end:

```bat
copy .env.example .env
```

Gere uma `SECRET_KEY`:

```bat
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copie o valor gerado e coloque no arquivo:

```text
backend\.env
```

Exemplo de configuração para desenvolvimento local:

```env
DATABASE_URL=sqlite:///./listasmart.db
SECRET_KEY=COLE_A_CHAVE_GERADA_AQUI
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
COOKIE_NAME=listasmart_session
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

## Criar e popular o banco SQLite

Ainda dentro da pasta `backend`:

```bat
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.seed
```

Isso cria o banco local:

```text
backend/listasmart.db
```

O seed cria dados iniciais, incluindo uma conta de demonstração.

## Conta de demonstração

```text
E-mail: demo@listasmart.com
Senha: 12345678
```

## Rodar o projeto web no PC

Você precisa de dois terminais abertos.

### Terminal 1 - back-end

Na pasta `backend`:

```bat
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Teste a API:

```text
http://localhost:8000/api/health
```

### Terminal 2 - front-end

Na raiz do projeto:

```bat
npm run dev -- --host 0.0.0.0
```

Acesse no navegador:

```text
http://localhost:5173
```

## Rodar no celular pela rede local

Para acessar pelo celular, o computador e o celular precisam estar na mesma rede.

Descubra o IP do computador:

```bat
ipconfig
```

Procure o endereço IPv4. Exemplo:

```text
192.168.0.25
```

Com o back-end e o front-end rodando, acesse no celular:

```text
http://192.168.0.25:5173
```

Troque `192.168.0.25` pelo IP real do seu computador.

Se o celular não conseguir abrir, confira:

- se o front está rodando com `--host 0.0.0.0`;
- se o back está rodando com `--host 0.0.0.0`;
- se o Windows Firewall liberou Node.js e Python na rede privada;
- se computador e celular estão na mesma rede.

## Rodar o mobile demonstrativo com Expo + WebView

O mobile é uma demonstração em Expo que abre o mesmo front-end web dentro de uma WebView.

Entre na pasta mobile:

```bat
cd mobile
npm install
```

Crie o arquivo `.env`:

```bat
copy .env.example .env
```

No `mobile/.env`, configure a URL do front usando o IP do computador:

```env
EXPO_PUBLIC_WEB_URL=http://IP_DO_COMPUTADOR:5173
```

Exemplo:

```env
EXPO_PUBLIC_WEB_URL=http://192.168.0.25:5173
```

Inicie o Expo:

```bat
npx expo start --tunnel --clear
```

Se o Expo perguntar se pode instalar `@expo/ngrok`, responda `y`.

Depois, leia o QR Code com o app Expo Go.

## URLs úteis

```text
Front-end web:       http://localhost:5173
API FastAPI:         http://localhost:8000
Swagger da API:      http://localhost:8000/docs
Healthcheck da API:  http://localhost:8000/api/health
Celular na rede:     http://IP_DO_COMPUTADOR:5173
```

## Testes e validação

### Front-end

Na raiz do projeto:

```bat
npm run lint
npm run typecheck
npm run test
npm run build
```

### Back-end

Na pasta `backend`:

```bat
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall app tests
.\.venv\Scripts\alembic.exe upgrade head
```

### Mobile

Na pasta `mobile`:

```bat
npx expo-doctor
npx tsc --noEmit
```

## Principais rotas da API

Todas as rotas usam o prefixo `/api`.

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/signup` | Cadastrar usuário |
| POST | `/api/auth/login` | Entrar no sistema |
| POST | `/api/auth/logout` | Sair do sistema |
| GET | `/api/auth/me` | Buscar usuário autenticado |
| PATCH | `/api/auth/me` | Atualizar perfil |

### Produtos, mercados e preços

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/products` | Listar produtos |
| GET | `/api/products/{id}` | Buscar produto por ID |
| POST | `/api/products` | Criar produto |
| GET | `/api/markets` | Listar mercados |
| GET | `/api/prices/matrix` | Matriz de preços |
| POST | `/api/prices` | Registrar ou atualizar preço |

### Listas de compras

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/lists` | Listar listas do usuário |
| POST | `/api/lists` | Criar lista |
| GET | `/api/lists/{id}` | Buscar lista |
| PATCH | `/api/lists/{id}` | Renomear lista |
| DELETE | `/api/lists/{id}` | Excluir lista |
| POST | `/api/lists/{id}/items` | Adicionar item |
| PATCH | `/api/lists/{id}/items/{productId}` | Alterar quantidade |
| DELETE | `/api/lists/{id}/items/{productId}` | Remover item |
| DELETE | `/api/lists/{id}/items` | Limpar lista |
| GET | `/api/lists/{id}/comparison` | Comparar preços da lista |

## Segurança

- O token de sessão fica em cookie httpOnly.
- O JavaScript do front-end não acessa o JWT diretamente.
- Requisições autenticadas usam `credentials: include`.
- Operações que alteram dados usam proteção CSRF por double-submit cookie.
- Senhas são armazenadas com hash bcrypt.
- `SECRET_KEY` deve ser gerada localmente e nunca versionada.

## Arquivos que não devem ir para o Git

Confira se estes arquivos/pastas não estão versionados:

```text
.env
.env.*
backend/.env
backend/.venv/
backend/listasmart.db
*.db
*.sqlite
*.bak
node_modules/
mobile/node_modules/
dist/
mobile/.expo/
```

Os arquivos `.env.example` devem ser versionados, pois servem como modelo de configuração.

## Estrutura do projeto

```text
ListaSmart/
├── src/                    # Front-end React + Vite
├── public/                 # Arquivos públicos e imagens usadas pelo front
├── img/                    # Imagens de referência dos produtos
├── backend/                # API FastAPI + SQLite + Alembic
│   ├── app/                # Código principal da API
│   ├── alembic/            # Migrations do banco
│   ├── tests/              # Testes do back-end
│   └── requirements.txt
├── mobile/                 # App Expo demonstrativo com WebView
├── package.json            # Dependências/scripts do front-end
├── vite.config.ts          # Configuração do Vite e proxy /api
└── README.md
```

## Observações para entrega acadêmica

Para entregar ao professor, envie o link do repositório e avise que as instruções estão neste README.

Antes de enviar, é recomendado rodar:

```bat
npm run lint
npm run typecheck
npm run test
npm run build
```

E no back-end:

```bat
cd backend
.\.venv\Scripts\python.exe -m pytest
```

Se o professor for rodar em outro computador, ele deve criar os arquivos `.env` a partir dos `.env.example`, rodar as migrations e executar o seed.
