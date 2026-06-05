/**
 * Avatar — imagem do usuário com fallback para iniciais.
 *
 * SECURITY: a URL da imagem passa por `safeUrl()` antes de ir ao atributo src.
 */
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { safeUrl } from '@/lib/sanitize';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = safeUrl(src);
  const showImage = url && !failed;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-soft font-semibold text-secondary-active ring-2 ring-surface',
        sizes[size],
        className,
      )}
      title={name}
    >
      {showImage ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
