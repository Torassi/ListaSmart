/**
 * PreferencesContext — preferências do usuário (região e mercados favoritos).
 *
 * Persistido em localStorage (DADOS NÃO SENSÍVEIS — não há segredo/token aqui).
 * Quando houver back-end, estas preferências passarão a ser salvas no perfil.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface Preferences {
  region: string;
  favoriteMarketIds: string[];
}

interface PreferencesContextValue extends Preferences {
  setRegion: (region: string) => void;
  toggleFavoriteMarket: (marketId: string) => void;
  isFavoriteMarket: (marketId: string) => boolean;
}

const STORAGE_KEY = 'lista-smart:preferences';
const DEFAULTS: Preferences = { region: 'Grande Florianópolis (SC)', favoriteMarketIds: ['bistek'] };

function load(): Preferences {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      region: typeof parsed.region === 'string' ? parsed.region : DEFAULTS.region,
      favoriteMarketIds: Array.isArray(parsed.favoriteMarketIds)
        ? parsed.favoriteMarketIds
        : DEFAULTS.favoriteMarketIds,
    };
  } catch {
    return DEFAULTS;
  }
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // storage indisponível — ignora.
    }
  }, [prefs]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      setRegion: (region) => setPrefs((p) => ({ ...p, region })),
      toggleFavoriteMarket: (marketId) =>
        setPrefs((p) => ({
          ...p,
          favoriteMarketIds: p.favoriteMarketIds.includes(marketId)
            ? p.favoriteMarketIds.filter((id) => id !== marketId)
            : [...p.favoriteMarketIds, marketId],
        })),
      isFavoriteMarket: (marketId) => prefs.favoriteMarketIds.includes(marketId),
    }),
    [prefs],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de <PreferencesProvider>.');
  return ctx;
}
