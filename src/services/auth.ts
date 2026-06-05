/**
 * Service de autenticação — MOCK (substituível pela API real, ver `http.ts`).
 *
 * SECURITY (como deve ser na integração real):
 * - O back-end valida as credenciais e responde definindo um cookie de sessão
 *   httpOnly + Secure + SameSite. O front NÃO recebe nem guarda o token.
 * - Estas funções só devolvem dados públicos do usuário (perfil) para a UI.
 * - O cliente revalida com zod apenas por UX; a verdade é sempre do servidor.
 */
import type { LoginInput, SignupInput } from '@/lib/validation';
import type { User } from '@/types';
import { delay } from './http';

/** Deriva um nome de exibição a partir do e-mail (só para o mock). */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'usuário';
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Login mockado: aceita qualquer credencial válida (já validada por zod) e
 * devolve um perfil. Na API real, troque por uma chamada que faz o servidor
 * setar o cookie de sessão.
 */
export async function login({ email }: LoginInput): Promise<User> {
  const user: User = {
    id: 'u1',
    name: nameFromEmail(email),
    email,
  };
  return delay(user, 500);
}

/** Cadastro mockado: cria um perfil a partir dos dados do formulário. */
export async function signup({ name, email }: SignupInput): Promise<User> {
  const user: User = {
    id: `u-${Date.now()}`,
    name,
    email,
  };
  return delay(user, 600);
}

/** Logout mockado. Na API real, faz o servidor invalidar/expirar o cookie. */
export async function logout(): Promise<void> {
  return delay(undefined, 150);
}
