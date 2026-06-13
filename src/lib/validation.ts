/**
 * Schemas de validação (zod) — validação e sanitização de entrada do usuário.
 *
 * SECURITY:
 * - O cliente NÃO é fonte de verdade: estes schemas melhoram a UX e barram
 *   entradas obviamente inválidas, mas o servidor DEVE revalidar tudo.
 * - `.trim()` evita espaços enganosos; limites de tamanho mitigam payloads abusivos.
 */
import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  'Hortifrúti',
  'Açougue',
  'Padaria',
  'Laticínios',
  'Mercearia',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Congelados',
] as const;

/** Busca livre (Home / lista). Limita tamanho para evitar abuso. */
export const searchSchema = z.object({
  query: z.string().trim().max(80, 'Busca muito longa.'),
});
export type SearchInput = z.infer<typeof searchSchema>;

/** Login. */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Cadastro (com confirmação de senha). */
export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.').max(80),
    email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof signupSchema>;

/** Edição de perfil. */
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80),
  region: z.string().trim().min(2, 'Informe sua região.').max(80),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/** Cadastro manual de produto + preço (slide-over da lista). */
export const productPriceSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do produto.').max(80),
  category: z.enum(PRODUCT_CATEGORIES, { message: 'Selecione uma categoria.' }),
  quantity: z.coerce
    .number({ message: 'Quantidade inválida.' })
    .int('Use um número inteiro.')
    .min(1, 'Mínimo 1.')
    .max(999, 'Máximo 999.'),
  marketId: z.string().min(1, 'Selecione um mercado.'),
  price: z.coerce
    .number({ message: 'Preço inválido.' })
    .positive('O preço deve ser maior que zero.')
    .max(100000, 'Preço fora do intervalo.'),
});
export type ProductPriceInput = z.infer<typeof productPriceSchema>;

/** Cadastro manual de um produto no catálogo (com um preço inicial por mercado). */
export const catalogProductSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do produto.').max(80),
  category: z.enum(PRODUCT_CATEGORIES, { message: 'Selecione uma categoria.' }),
  unit: z.string().trim().min(1, 'Informe a unidade (ex.: 1 kg).').max(20),
  // Código de barras opcional; se preenchido, deve ter 8 a 14 dígitos.
  barcode: z
    .string()
    .trim()
    .regex(/^\d{8,14}$/, 'Código inválido (use de 8 a 14 dígitos).')
    .optional()
    .or(z.literal('')),
  marketId: z.string().min(1, 'Selecione um mercado.'),
  price: z.coerce
    .number({ message: 'Preço inválido.' })
    .positive('O preço deve ser maior que zero.')
    .max(100000, 'Preço fora do intervalo.'),
});
export type CatalogProductInput = z.infer<typeof catalogProductSchema>;
