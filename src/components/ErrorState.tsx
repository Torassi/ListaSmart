/**
 * ErrorState — estado de falha de carregamento com ação de tentar novamente.
 *
 * SECURITY: exibe apenas uma mensagem genérica ao usuário; nunca o objeto de
 * erro/stack (evita vazar detalhes internos).
 */
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  /** Mensagem amigável (genérica). */
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="grid place-items-center gap-3 py-10 text-center" role="alert">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm text-text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
