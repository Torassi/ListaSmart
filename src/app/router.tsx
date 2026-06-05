/**
 * Definição das rotas (React Router) com code-splitting.
 *
 * As páginas são carregadas sob demanda (React.lazy) para reduzir o bundle
 * inicial — em especial o Analytics, que carrega o Recharts só quando acessado.
 * /login fica fora do shell; as demais rotas vivem sob o AppLayout e são
 * protegidas por <ProtectedRoute> (redireciona para /login se não autenticado).
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { NotFoundPage } from './NotFoundPage';
import { PageLoader } from '@/components';

// Lazy pages (os componentes são exports nomeados → mapeia para default).
const AuthPage = lazy(() => import('@/features/auth/AuthPage').then((m) => ({ default: m.AuthPage })));
const HomePage = lazy(() => import('@/features/home/HomePage').then((m) => ({ default: m.HomePage })));
const ListPage = lazy(() => import('@/features/list/ListPage').then((m) => ({ default: m.ListPage })));
const ListsPage = lazy(() => import('@/features/list/ListsPage').then((m) => ({ default: m.ListsPage })));
const ComparePage = lazy(() =>
  import('@/features/compare/ComparePage').then((m) => ({ default: m.ComparePage })),
);
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

function lazyElement(node: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: lazyElement(<AuthPage />),
  },
  {
    // Tudo abaixo exige autenticação.
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: lazyElement(<HomePage />) },
          { path: 'lista', element: lazyElement(<ListPage />) },
          { path: 'listas', element: lazyElement(<ListsPage />) },
          { path: 'comparar', element: lazyElement(<ComparePage />) },
          { path: 'analytics', element: lazyElement(<AnalyticsPage />) },
          { path: 'perfil', element: lazyElement(<ProfilePage />) },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
