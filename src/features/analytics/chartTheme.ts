/** Paleta dos gráficos — alinhada aos design tokens (vívida para o tema escuro). */
export const CHART_COLORS = [
  '#10B981', // primary
  '#3B82F6', // secondary
  '#F59E0B', // warning
  '#F87171', // danger
  '#34D399', // primary claro
  '#60A5FA', // secondary claro
  '#FB923C', // accent
  '#A78BFA', // roxo
  '#F472B6', // rosa
] as const;

export const colorAt = (index: number): string => CHART_COLORS[index % CHART_COLORS.length];

/* Cores de chrome dos gráficos para o tema escuro (eixos, grade, tooltip). */
export const CHART_AXIS = '#AAB4C4'; // rótulos dos eixos
export const CHART_GRID = '#2B3647'; // linhas de grade
export const CHART_SURFACE = '#19212E'; // fundo de tooltip / traço das fatias
export const CHART_CURSOR = 'rgba(255,255,255,0.06)'; // realce de hover nas barras

/** Estilo padrão do tooltip do Recharts no tema escuro. */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: CHART_SURFACE,
  border: `1px solid ${CHART_GRID}`,
  borderRadius: 12,
  color: '#EEF2F7',
  fontSize: 13,
} as const;
