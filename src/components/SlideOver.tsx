/**
 * SlideOver — painel lateral deslizante (dialog acessível).
 *
 * Acessibilidade: role="dialog" + aria-modal, fecha com Esc e por clique no
 * overlay, foco movido para o painel ao abrir e bloqueio de scroll do body.
 */
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Conteúdo fixo no rodapé (ex.: botões de ação). */
  footer?: ReactNode;
}

export function SlideOver({ open, onClose, title, description, children, footer }: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // Move o foco para o painel ao abrir.
    panelRef.current?.focus();
    // Bloqueia o scroll do body enquanto aberto.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar painel"
        onClick={onClose}
        className="absolute inset-0 bg-text/40 animate-fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-card-hover outline-none animate-slide-in-right"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 id={titleId} className="text-lg font-extrabold text-text">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-sm text-text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && <footer className="border-t border-border p-5">{footer}</footer>}
      </div>
    </div>
  );
}
