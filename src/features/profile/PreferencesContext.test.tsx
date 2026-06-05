import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { PreferencesProvider, usePreferences } from './PreferencesContext';

function wrapper({ children }: { children: ReactNode }) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}

describe('PreferencesContext', () => {
  it('alterna mercado favorito (adiciona e remove)', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => result.current.toggleFavoriteMarket('giassi'));
    expect(result.current.isFavoriteMarket('giassi')).toBe(true);

    act(() => result.current.toggleFavoriteMarket('giassi'));
    expect(result.current.isFavoriteMarket('giassi')).toBe(false);
  });

  it('atualiza a região', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    act(() => result.current.setRegion('Curitiba (PR)'));
    expect(result.current.region).toBe('Curitiba (PR)');
  });
});
