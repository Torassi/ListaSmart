/**
 * Geração de imagens-placeholder locais (data URI SVG).
 *
 * Mantém o protótipo 100% offline e sem dependência externa para imagens de
 * produto. Em produção, troque `imageUrl` dos produtos por fotos reais servidas
 * via HTTPS — o componente de imagem já passa as URLs por `safeUrl()`.
 */

/** Monta um placeholder SVG (data URI) com um emoji centralizado e fundo suave. */
export function productPlaceholder(emoji: string, bg = '#E9F8F1'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${bg}"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="140">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
