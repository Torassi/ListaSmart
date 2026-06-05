/**
 * ErrorBoundary — captura erros de renderização e mostra um fallback amigável.
 *
 * SECURITY: nunca exibimos a mensagem/stack do erro ao usuário (evita vazar
 * detalhes internos). O detalhe vai apenas para o console em desenvolvimento;
 * em produção, envie para um serviço de monitoramento no `componentDidCatch`.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Apenas log local. Não propaga detalhes para a UI.
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary capturou um erro:', error, info);
    }
    // TODO: enviar para serviço de monitoramento (ex.: Sentry) em produção.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-bg px-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-bold text-text">Algo deu errado</h1>
            <p className="mt-2 text-sm text-text-muted">
              Não foi possível exibir esta página. Tente recarregar — se o problema persistir,
              volte mais tarde.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
