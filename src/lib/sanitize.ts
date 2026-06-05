/**
 * Utilitários de sanitização — defesa contra XSS.
 *
 * SECURITY:
 * - Nunca usamos `dangerouslySetInnerHTML`. Todo conteúdo dinâmico é renderizado
 *   como texto pelo React (que já escapa por padrão).
 * - Estas funções endurecem dados que entram em contextos sensíveis: atributos
 *   de URL (src/href) e remoção de caracteres de controle de strings vindas da API.
 * - Validação no cliente NÃO substitui a validação no servidor.
 */

/**
 * Remove caracteres de controle (C0 e DEL) e espaços nas pontas de uma string.
 * Útil ao exibir dados textuais vindos da API.
 */
export function sanitizeText(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) continue; // ignora caracteres de controle
    out += ch;
  }
  return out.trim();
}

/**
 * Garante que uma URL é segura para uso em `src`/`href`.
 * Bloqueia esquemas perigosos (javascript:, data: exceto imagens, etc.).
 * Retorna string vazia se a URL for inválida/insegura.
 */
export function safeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Permite caminhos relativos e âncoras.
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    // Permite data:image/* (útil para placeholders), mas nada de data:text/html.
    if (parsed.protocol === 'data:') {
      return /^data:image\//i.test(trimmed) ? trimmed : '';
    }
    const allowed = ['http:', 'https:'];
    if (!allowed.includes(parsed.protocol)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}
