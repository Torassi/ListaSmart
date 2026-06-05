/**
 * useDebounce — retorna o valor "atrasado" após o intervalo sem mudanças.
 * Útil para buscas: evita filtrar/consultar a cada tecla.
 */
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
