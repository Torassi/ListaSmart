/**
 * ProtectedRoute — protege rotas que exigem autenticação.
 *
 * Se o usuário não estiver autenticado, redireciona para /login guardando a
 * rota pretendida em `state.from`, para retornar a ela após o login.
 *
 * SECURITY: isto é apenas controle de acesso no cliente (UX). A autorização real
 * é responsabilidade do servidor — todo endpoint protegido deve exigir sessão
 * válida e nunca confiar no front-end.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // Aguarda a reidratação da sessão para não redirecionar quem já está logado.
  if (isInitializing) {
    return (
      <div className="grid min-h-screen place-items-center" aria-busy="true">
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
