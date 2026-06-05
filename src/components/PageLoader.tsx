/** PageLoader — fallback de carregamento para rotas com lazy loading. */
import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center" role="status" aria-live="polite">
      <span className="flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Carregando...
      </span>
    </div>
  );
}
