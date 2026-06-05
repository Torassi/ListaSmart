/** Paleta dos gráficos — alinhada aos design tokens (mesmos hex do tailwind.config). */
export const CHART_COLORS = [
  '#0E9F6E', // primary
  '#2563EB', // secondary
  '#F59E0B', // warning
  '#EF4444', // danger
  '#0B8A5F', // primary hover
  '#1D4FD7', // secondary hover
  '#94A3B8', // subtle
  '#047857', // primary active
  '#1E40AF', // secondary active
] as const;

export const colorAt = (index: number): string => CHART_COLORS[index % CHART_COLORS.length];
