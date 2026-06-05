/**
 * SocialButtons — botões de login social (Google/Facebook).
 *
 * Placeholders de integração: hoje apenas avisam que a integração virá depois.
 * SECURITY: o fluxo OAuth real é iniciado pelo back-end; o client secret NUNCA
 * fica no front-end. Apenas IDs públicos (VITE_GOOGLE_CLIENT_ID, etc.) podem
 * existir no cliente.
 */
import { useToast } from '@/hooks/useToast';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.96h-1.52c-1.49 0-1.95.93-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}

export function SocialButtons() {
  const { toast } = useToast();

  function notImplemented(provider: string) {
    toast(`Login com ${provider} será integrado em breve.`, 'info');
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => notImplemented('Google')}
        className="flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm font-semibold text-text transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
      >
        <GoogleIcon />
        Google
      </button>
      <button
        type="button"
        onClick={() => notImplemented('Facebook')}
        className="flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm font-semibold text-text transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
      >
        <FacebookIcon />
        Facebook
      </button>
    </div>
  );
}
