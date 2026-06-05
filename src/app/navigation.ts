/** Configuração central da navegação (sidebar). */
import { Home, ListChecks, ClipboardList, Scale, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Rota exata (para a Home não casar com todas as demais). */
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/lista', label: 'Lista atual', icon: ListChecks },
  { to: '/listas', label: 'Minhas listas', icon: ClipboardList },
  { to: '/comparar', label: 'Comparar preços', icon: Scale },
  { to: '/analytics', label: 'Inteligência', icon: BarChart3 },
];
