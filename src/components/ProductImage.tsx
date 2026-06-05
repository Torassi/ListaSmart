/**
 * ProductImage — <img> seguro para imagens de produto.
 *
 * SECURITY: a URL passa por `safeUrl()` (bloqueia javascript:/data:text/html);
 * sempre exige `alt` (acessibilidade) e usa loading="lazy".
 */
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { safeUrl } from '@/lib/sanitize';

export interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const url = safeUrl(src);

  if (!url || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('grid place-items-center bg-bg text-text-subtle', className)}
      >
        <ImageOff className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
