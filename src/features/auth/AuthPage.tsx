/**
 * AuthPage — tela de onboarding em layout split.
 * Esquerda: marca + proposta de valor. Direita: formulário (login/cadastro) com
 * alternância entre os modos e login social.
 */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, ShieldCheck, Sparkles, Store } from 'lucide-react';
import { useAuth } from './AuthContext';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { SocialButtons } from './SocialButtons';

type Mode = 'login' | 'signup';

const highlights = [
  { icon: Store, text: 'Compare preços entre Giassi, Angeloni, Bistek e Comper' },
  { icon: Sparkles, text: 'Monte listas colaborativas com sua família' },
  { icon: BarChart3, text: 'Veja onde economizar com dados claros' },
];

export function AuthPage() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  // Já autenticado não deve ver a tela de login.
  if (isAuthenticated) return <Navigate to="/" replace />;

  const isLogin = mode === 'login';

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca (oculto em telas pequenas) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-white/15 text-lg font-extrabold">
            L
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Lista<span className="text-white/80">Smart</span>
          </span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">
            Sua lista de compras, mais inteligente e econômica.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/15">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Seus dados são tratados com segurança.
        </p>
      </aside>

      {/* Painel do formulário */}
      <main className="flex items-center justify-center bg-bg px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Marca compacta no mobile */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-lg font-extrabold text-white">
              L
            </span>
            <span className="text-lg font-extrabold tracking-tight text-text">
              Lista<span className="text-primary">Smart</span>
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-text">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {isLogin
              ? 'Entre para acessar suas listas e economias.'
              : 'Comece a economizar nas suas compras hoje.'}
          </p>

          <div className="mt-6">{isLogin ? <LoginForm /> : <SignupForm />}</div>

          {/* Divisor */}
          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-text-subtle">ou continue com</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <SocialButtons />

          {/* Alternância login/cadastro */}
          <p className="mt-8 text-center text-sm text-text-muted">
            {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => setMode(isLogin ? 'signup' : 'login')}
              className="font-semibold text-secondary hover:text-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            >
              {isLogin ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
