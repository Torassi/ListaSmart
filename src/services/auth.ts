/**
 * Service de autenticação — MOCK LEGADO (NÃO usado pela aplicação).
 *
 * O app autentica pela API real em `src/services/api/auth.ts` (JWT em cookie
 * httpOnly + CSRF). Este arquivo permanece apenas como referência histórica e
 * para seu próprio teste unitário (`auth.test.ts`).
 *
 * Aqui as contas ficam num "banco" em localStorage com hash trivial — ISTO NÃO
 * É SEGURO e nunca deve ser usado em produção. Na implementação real (já em uso):
 * - credenciais verificadas NO SERVIDOR; senha com bcrypt no banco;
 * - sessão em cookie httpOnly + Secure + SameSite; o front não armazena o token.
 */
import type { LoginInput, SignupInput } from '@/lib/validation';
import type { User } from '@/types';
import { delay } from './http';

const USERS_KEY = 'lista-smart:users';

interface StoredAccount extends User {
  passwordHash: string;
}

/** Hash NÃO seguro — apenas evita salvar a senha em texto puro no mock. */
function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (h * 31 + password.charCodeAt(i)) | 0;
  }
  return `h${h >>> 0}`;
}

function loadAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
  } catch {
    // storage indisponível — ignora.
  }
}

/** Garante uma conta de demonstração para facilitar os testes. */
function ensureSeed(accounts: StoredAccount[]): StoredAccount[] {
  if (accounts.length > 0) return accounts;
  const demo: StoredAccount = {
    id: 'demo',
    name: 'Demonstração',
    email: 'demo@listasmart.com',
    passwordHash: hashPassword('12345678'),
  };
  const seeded = [demo];
  saveAccounts(seeded);
  return seeded;
}

/** Remove o hash antes de devolver o perfil à aplicação. */
function toUser(account: StoredAccount): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...user } = account;
  return user;
}

/** Login: valida e-mail + senha contra o "banco" local. */
export async function login({ email, password }: LoginInput): Promise<User> {
  const accounts = ensureSeed(loadAccounts());
  const normalized = email.trim().toLowerCase();
  const account = accounts.find((a) => a.email.toLowerCase() === normalized);

  // Mensagem genérica de propósito (não revela se o e-mail existe).
  if (!account || account.passwordHash !== hashPassword(password)) {
    await delay(null, 400);
    throw new Error('E-mail ou senha incorretos.');
  }
  return delay(toUser(account), 400);
}

/** Cadastro: registra uma nova conta (e-mail único). */
export async function signup({ name, email, password }: SignupInput): Promise<User> {
  const accounts = loadAccounts();
  const normalized = email.trim().toLowerCase();

  if (accounts.some((a) => a.email.toLowerCase() === normalized)) {
    await delay(null, 400);
    throw new Error('Este e-mail já está cadastrado.');
  }

  const account: StoredAccount = {
    id: `u-${Date.now()}`,
    name,
    email,
    passwordHash: hashPassword(password),
  };
  saveAccounts([...accounts, account]);
  return delay(toUser(account), 500);
}

/** Logout mockado. Na API real, faz o servidor invalidar/expirar o cookie. */
export async function logout(): Promise<void> {
  return delay(undefined, 150);
}
