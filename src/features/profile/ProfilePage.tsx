/**
 * ProfilePage — perfil e preferências do usuário.
 * Edita nome + região (rhf+zod) e gerencia mercados favoritos (toggle imediato).
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Store } from 'lucide-react';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from '@/components';
import { cn } from '@/lib/cn';
import { profileSchema } from '@/lib/validation';
import type { ProfileInput } from '@/lib/validation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/features/auth/AuthContext';
import { usePreferences } from './PreferencesContext';
import { useMarkets } from '@/features/list/queries';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { region, setRegion, favoriteMarketIds, toggleFavoriteMarket } = usePreferences();
  const { toast } = useToast();
  const marketsQuery = useMarkets();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', region },
  });

  function onSubmit(values: ProfileInput) {
    updateUser({ name: values.name });
    setRegion(values.region);
    toast('Perfil atualizado', 'success');
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-center gap-4">
        <Avatar name={user?.name ?? 'Usuário'} src={user?.avatarUrl} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">{user?.name ?? 'Usuário'}</h1>
          <p className="text-sm text-text-muted">{user?.email}</p>
        </div>
      </header>

      {/* Dados do perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do perfil</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Field label="Nome" error={errors.name?.message} required>
              {({ id, describedBy }) => (
                <Input id={id} hasError={!!errors.name} aria-describedby={describedBy} {...register('name')} />
              )}
            </Field>

            <Field label="Região" error={errors.region?.message} hint="Usada para sugerir mercados próximos." required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  hasError={!!errors.region}
                  aria-describedby={describedBy}
                  {...register('region')}
                />
              )}
            </Field>

            <div>
              <Button type="submit" isLoading={isSubmitting}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Mercados favoritos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-danger" aria-hidden="true" />
            Mercados favoritos
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-text-muted">
            Selecione os mercados que você costuma frequentar para priorizá-los nas comparações.
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Mercados favoritos">
            {(marketsQuery.data ?? []).map((m) => {
              const active = favoriteMarketIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleFavoriteMarket(m.id)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text',
                  )}
                >
                  <Store className="h-3.5 w-3.5" aria-hidden="true" />
                  {m.name}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
