# Lista Smart — Front-end

Plataforma web de **listas de compras colaborativas** com foco em **economia** e
**comparação de preços** entre supermercados da região (ex.: Giassi, Angeloni, Bistek, Comper).

Interface desktop-first, baseada em grid, com Design System próprio e dados **mockados**
(sem back-end por enquanto — a camada `services/` é trivialmente substituível por API real).

---

## Stack

- **React + Vite + TypeScript** (strict)
- **React Router** (navegação)
- **Tailwind CSS v3** — design tokens centralizados em [`tailwind.config.js`](tailwind.config.js)
- **TanStack Query (React Query)** + **Context API** (estado de servidor + estado global)
- **react-hook-form + zod** (formulários e validação)
- **Recharts** (gráficos — usados a partir da Etapa 5)
- **lucide-react** (ícones)
- **ESLint + Prettier** (com `prettier-plugin-tailwindcss`)
- **Vitest + Testing Library** (testes)

---

## Como rodar

Pré-requisitos: **Node 18+** e **npm**.

```bash
npm install      # instala as dependências
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
```

**Acesso de teste (mock):** use a conta de demonstração **`demo@listasmart.com`** / **`12345678`**,
ou crie a sua em **Cadastre-se** (fica registrada localmente). A sessão persiste ao recarregar a página.

### Scripts

| Script              | Descrição                                          |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (Vite)                 |
| `npm run build`     | Type-check (`tsc -b`) + build de produção          |
| `npm run preview`   | Pré-visualiza o build de produção                  |
| `npm run lint`      | ESLint                                             |
| `npm run format`    | Prettier (formata `src/`)                          |
| `npm run test`      | Testes (Vitest, modo CI)                           |
| `npm run test:watch`| Testes em modo watch                               |
| `npm run typecheck` | Verificação de tipos sem emitir                    |

---

## Estrutura

```
src/
  app/         # shell (sidebar + topbar), rotas, providers, error boundary
  components/  # Design System (Button, Input/Field, Card, Badge, Table, KpiCard, Avatar, Toast, ...)
  features/
    auth/      # login e cadastro                (Etapa 2 ✅)
    home/      # dashboard + catálogo de produtos (Etapa 1 ✅)
    list/      # listas (gestão + múltiplas listas) (Etapas 3, 7 ✅)
    compare/   # comparador de preços             (Etapa 4 ✅)
    analytics/ # dashboard de inteligência        (Etapa 5 ✅)
    profile/   # perfil + preferências            (Etapa 8 ✅)
  hooks/       # useToast, useDebounce, ...
  services/    # camada de API isolada (mocks hoje) — getProducts(), getFavorites(), ...
  lib/         # cn(), formatação de moeda, validação (zod), sanitização
  styles/      # index.css (diretivas Tailwind + fonte base)
  types/       # tipagens compartilhadas (rascunho do contrato de dados)
  test/        # setup e utilitários de teste
```

### Design tokens

Cores, fontes, raios e sombras vivem em [`tailwind.config.js`](tailwind.config.js) (`theme.extend`)
e são aplicados via classes utilitárias — **sem valores mágicos** espalhados. Componentes
recorrentes são compostos com `@apply` em [`src/styles/index.css`](src/styles/index.css).
Fonte base: **Manrope** (fallback `Segoe UI`, `system-ui`). Valores monetários usam `tabular-nums`.

### Camada de dados (mock → API real)

Todos os dados saem de [`src/services`](src/services) (que hoje leem de `mockData.ts` com latência
simulada). Para plugar o back-end, basta implementar o cliente em
[`src/services/http.ts`](src/services/http.ts) e trocar o corpo das funções `getX()`, **mantendo as
assinaturas e os tipos** de [`src/types`](src/types).

---

## Segurança

Segurança faz parte da definição de pronto. O que já está aplicado / documentado:

- **Validação de entrada com zod** ([`src/lib/validation.ts`](src/lib/validation.ts)) — com a ressalva
  explícita de que **o cliente não é fonte de verdade**: o servidor deve revalidar tudo.
- **Anti-XSS**: nada de `dangerouslySetInnerHTML`; URLs de imagem passam por `safeUrl()`
  ([`src/lib/sanitize.ts`](src/lib/sanitize.ts)); React escapa o conteúdo por padrão.
- **CSP** de linha de base no [`index.html`](index.html) (em produção, envie pelos headers do servidor).
- **Variáveis de ambiente** via `.env` (prefixo `VITE_`), com `.env` no `.gitignore`
  (veja [`.env.example`](.env.example)). Nenhum segredo no bundle.
- **Autenticação** (Etapa 2): hoje é um **mock**. As contas ficam num "banco" local
  (localStorage, senha com hash trivial só para não guardar em texto puro) e a **sessão persiste**
  entre refreshes. **Isso é apenas simulação** — em produção, as credenciais são validadas **no
  servidor** (senha com bcrypt/argon2 no banco) e a sessão vem em **cookie httpOnly + Secure +
  SameSite**, com `credentials: 'include'` e header **anti-CSRF**. Nada de token/segredo no storage.
  Diretrizes em [`src/services/http.ts`](src/services/http.ts), [`src/services/auth.ts`](src/services/auth.ts)
  e [`src/features/auth/AuthContext.tsx`](src/features/auth/AuthContext.tsx).
- **Controle de acesso**: rotas privadas protegidas por
  [`ProtectedRoute`](src/app/ProtectedRoute.tsx) (redireciona para /login) — apenas UX; a autorização
  real é sempre do servidor.
- **Tratamento de erros** sem vazar detalhes internos ([`src/app/ErrorBoundary.tsx`](src/app/ErrorBoundary.tsx)).
- **Dependências**: versões fixadas via `package-lock.json`; rode `npm audit` periodicamente.

Pontos sensíveis estão marcados no código com comentários `SECURITY:`.

### Sobre o `npm audit` (estado atual)

O `npm audit` aponta avisos **somente na cadeia de ferramentas de desenvolvimento**
(`esbuild` → `vite` → `vitest`/`vite-node`):

- `esbuild`/`vite` (moderado): afeta apenas o **servidor de desenvolvimento** local.
- `vitest` (crítico): só explorável com o **Vitest UI server** ativo — recurso que **não usamos**.

**Nenhum desses pacotes vai para o bundle de produção** (`dist/`), então não há exposição em runtime
para o usuário final. O `npm audit fix --force` só resolve subindo para **Vite 8 / Vitest 4** (mudanças
_major_); essa atualização ficará para uma etapa de manutenção dedicada, com a suíte de testes validando
a migração. Em produção, o build é estático e deve ser servido por HTTPS atrás de uma CDN/servidor que
aplique os headers de segurança.

---

## Roadmap (entrega por etapas)

- [x] **Etapa 1** — Setup, Design System e **Home com catálogo de produtos**
- [x] **Etapa 2** — Autenticação (login/cadastro split + login social) + rotas protegidas
- [x] **Etapa 3** — Gestão da lista + slide-over de produto/preço
- [x] **Etapa 4** — Comparador de preços
- [x] **Etapa 5** — Dashboard de inteligência (analytics)
- [x] **Etapa 6** — Polimento (responsividade, acessibilidade, revisão de segurança)
- [x] **Etapa 7** — Múltiplas listas (criar/renomear/excluir/alternar) com persistência local
- [x] **Etapa 8** — Perfil & preferências (nome, região, mercados favoritos)
- [x] **Etapa 9** — Busca por código de barras + estados de erro/retry nas telas
- [x] **Etapa 10** — Hardening: CI (GitHub Actions), testes adicionais, revisão final

> **Persistência local**: listas e preferências são salvas em `localStorage` por serem
> **dados não sensíveis**. Sessão/token NUNCA usam storage (ver Segurança). Quando o
> back-end existir, esses dados migram para o perfil do usuário no servidor.

> **CI**: o workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda lint,
> typecheck, testes, build e `npm audit` (high+) a cada push/PR na `main`.
