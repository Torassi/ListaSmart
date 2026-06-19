/**
 * Service de autenticação — implementação REAL (back-end FastAPI), em uso pelo
 * `AuthContext`. A sessão é mantida em cookie httpOnly definido pelo servidor
 * (ver `services/http.ts`); o token nunca chega ao JavaScript.
 */
import type { LoginInput, SignupInput } from '@/lib/validation';
import type { User } from '@/types';
import { apiGet, apiPatch, apiPost } from '../http';

export async function login({ email, password }: LoginInput): Promise<User> {
  return apiPost<User>('/auth/login', { email, password });
}

export async function signup({ name, email, password }: SignupInput): Promise<User> {
  return apiPost<User>('/auth/signup', { name, email, password });
}

export async function logout(): Promise<void> {
  await apiPost<void>('/auth/logout');
}

/** Reidrata o perfil a partir do cookie de sessão (use ao carregar a app). */
export async function getCurrentUser(): Promise<User> {
  return apiGet<User>('/auth/me');
}

export async function updateProfile(patch: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User> {
  return apiPatch<User>('/auth/me', patch);
}
