/**
 * SignupForm — formulário de cadastro (react-hook-form + zod).
 * Inclui confirmação de senha (regra no `signupSchema`).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, PasswordInput } from '@/components';
import { signupSchema } from '@/lib/validation';
import type { SignupInput } from '@/lib/validation';
import { useAuth } from './AuthContext';

export function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    try {
      await signup(values);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Não foi possível concluir o cadastro. Tente novamente.',
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

      <Field label="Nome" error={errors.name?.message} required>
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            hasError={!!errors.name}
            aria-describedby={describedBy}
            {...register('name')}
          />
        )}
      </Field>

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

      <Field
        label="Senha"
        error={errors.password?.message}
        hint="Mínimo de 8 caracteres."
        required
      >
        {({ id, describedBy }) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            placeholder="••••••••"
            hasError={!!errors.password}
            aria-describedby={describedBy}
            {...register('password')}
          />
        )}
      </Field>

      <Field label="Confirmar senha" error={errors.confirmPassword?.message} required>
        {({ id, describedBy }) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            placeholder="••••••••"
            hasError={!!errors.confirmPassword}
            aria-describedby={describedBy}
            {...register('confirmPassword')}
          />
        )}
      </Field>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
        Criar conta
      </Button>
    </form>
  );
}
