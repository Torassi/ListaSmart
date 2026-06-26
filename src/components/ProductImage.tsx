/**
 * ProductImage — <img> seguro para imagens de produto.
 *
 * SECURITY: a URL passa por `safeUrl()` (bloqueia javascript:/data:text/html);
 * sempre exige `alt` (acessibilidade) e usa loading="lazy".
 *
 * Quando não há imagem (ou ela falha ao carregar), renderiza um fallback visual
 * crível: um ladrilho com tom estável derivado do nome + iniciais do produto e
 * um ícone de sacola — em vez de um ícone genérico de "imagem quebrada".
 */
import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { safeUrl } from '@/lib/sanitize';

export interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Gradientes escuros de marca/alimentos; escolha determinística por nome (sem libs).
// Texto em tom claro para contraste no tema escuro.
const FALLBACK_TONES = [
  'from-[#10271D] to-[#163A2A] text-primary-active',
  'from-[#152641] to-[#1B3357] text-secondary-active',
  'from-[#2A1A0F] to-[#3A2412] text-accent-active',
  'from-[#2A1830] to-[#3A1F33] text-[#F9A8D4]',
  'from-[#1A2036] to-[#232A4A] text-[#A5B4FC]',
] as const;

function hashIndex(text: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash % mod;
}

function initials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const url = safeUrl(src);

  if (!url || failed) {
    const tone = FALLBACK_TONES[hashIndex(alt, FALLBACK_TONES.length)];
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'relative grid place-items-center overflow-hidden bg-gradient-to-br',
          tone,
          className,
        )}
      >
        <ShoppingBag
          className="absolute -bottom-3 -right-2 h-16 w-16 opacity-15"
          aria-hidden="true"
        />
        <span className="relative text-2xl font-extrabold tracking-tight" aria-hidden="true">
          {initials(alt)}
        </span>
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
