/**
 * Toast — notificação não-bloqueante (parte visual).
 * O estado/fila vive em `@/hooks/useToast`; aqui só renderizamos o cartão.
 */
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastData {
  id: string;
  message: string;
  tone: ToastTone;
}

const toneConfig: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-primary-active' },
  info: { icon: Info, className: 'text-secondary-active' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  error: { icon: AlertTriangle, className: 'text-danger' },
};

export interface ToastCardProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { icon: Icon, className } = toneConfig[toast.tone];

  return (
    <div
      role="status"
      className="flex w-80 max-w-[calc(100vw-2rem)] animate-toast-in items-start gap-3 rounded-md border border-border bg-surface p-3 shadow-card-hover"
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', className)} aria-hidden="true" />
      <p className="flex-1 text-sm text-text">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-text-subtle hover:bg-bg hover:text-text"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
