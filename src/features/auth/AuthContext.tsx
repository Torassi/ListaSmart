/**
 * AuthContext — estado de autenticação da aplicação (mock).
 *
 * SECURITY:
 * - O perfil do usuário é mantido APENAS em memória (React state). Não usamos
 *   localStorage/sessionStorage para sessão/token — isso é vulnerável a XSS.
 * - Na integração real, a sessão vive num cookie httpOnly definido pelo servidor;
 *   ao carregar a app, faríamos um `GET /me` (com `credentials: 'include'`) para
 *   reidratar o perfil. Por isso um refresh hoje volta para o login — comportamento
 *   esperado do mock, que demonstra corretamente as rotas protegidas.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginInput, SignupInput } from '@/lib/validation';
import type { User } from '@/types';
import * as authService from '@/services/auth';

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
  const [user, setUser] = useState<User | null>(null);

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
