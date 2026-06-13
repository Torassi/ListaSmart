/**
 * LoginForm — formulário de login (react-hook-form + zod).
 *
 * SECURITY: validação no cliente é só UX; o servidor revalida. Erros de
 * autenticação são exibidos de forma genérica (sem vazar qual campo falhou
 * nem detalhes internos).
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, PasswordInput } from '@/components';
import { loginSchema } from '@/lib/validation';
import type { LoginInput } from '@/lib/validation';
import { useAuth } from './AuthContext';

interface LocationState {
  from?: { pathname?: string };
}

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      await login(values);
      const from = (location.state as LocationState | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      // Mensagem do service (já genérica por segurança) ou fallback.
      setFormError(
        err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.',
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {formError && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {formError}
        </p>
      )}

      <Field label="E-mail" error={errors.email?.message} required>
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            hasError={!!errors.email}
            aria-describedby={describedBy}
            {...register('email')}
          />
        )}
      </Field>

      <Field label="Senha" error={errors.password?.message} required>
        {({ id, describedBy }) => (
          <PasswordInput
            id={id}
            autoComplete="current-password"
            placeholder="••••••••"
            hasError={!!errors.password}
            aria-describedby={describedBy}
            {...register('password')}
          />
        )}
      </Field>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
        Entrar
      </Button>
    </form>
  );
}
