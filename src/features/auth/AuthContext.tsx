/**
 * AuthContext — estado de autenticação da aplicação (mock).
 *
 * A sessão é persistida em localStorage para sobreviver ao refresh da página
 * (apenas o PERFIL público — neste mock não há token real).
 *
 * SECURITY:
 * - Guardar a sessão em localStorage só é aceitável aqui porque NÃO há token/
 *   segredo: é um mock. Em produção, NUNCA armazene token de sessão no storage
 *   (vulnerável a XSS) — use cookie httpOnly+Secure+SameSite definido pelo
 *   servidor e reidrate o perfil com `GET /me` (`credentials: 'include'`) ao
 *   carregar a app.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginInput, SignupInput } from '@/lib/validation';
import type { User } from '@/types';
import * as authService from '@/services/auth';

const SESSION_KEY = 'lista-smart:session';

/** Carrega o perfil da sessão persistida (mock). */
function loadSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Atualiza dados do perfil em memória (ex.: nome editado na tela de perfil). */
  updateUser: (patch: Partial<Pick<User, 'name'>>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession);

  // Persiste/limpa a sessão (perfil) para sobreviver ao refresh.
  useEffect(() => {
    try {
      if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // storage indisponível — ignora.
    }
  }, [user]);

  const login = useCallback(async (input: LoginInput) => {
    const u = await authService.login(input);
    setUser(u);
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const u = await authService.signup(input);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<Pick<User, 'name'>>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, signup, logout, updateUser }),
    [user, login, signup, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
