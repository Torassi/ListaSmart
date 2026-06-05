/** CollaboratorsAvatars — pilha de avatares dos colaboradores da lista. */
import { UserPlus } from 'lucide-react';
import { Avatar } from '@/components';
import type { User } from '@/types';

interface CollaboratorsAvatarsProps {
  users: User[];
  /** Máximo de avatares exibidos antes de agrupar em "+N". */
  max?: number;
}

export function CollaboratorsAvatars({ users, max = 4 }: CollaboratorsAvatarsProps) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((u) => (
          <Avatar key={u.id} name={u.name} src={u.avatarUrl} size="md" />
        ))}
        {extra > 0 && (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-bg text-xs font-semibold text-text-muted ring-2 ring-surface">
            +{extra}
          </span>
        )}
      </div>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full border border-dashed border-border text-text-muted hover:border-primary hover:text-primary"
        aria-label="Convidar colaborador"
        title="Convidar colaborador"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
