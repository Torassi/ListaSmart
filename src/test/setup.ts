import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpa o DOM renderizado e o localStorage após cada teste (evita vazamento de
// estado entre eles — ex.: persistência das listas).
afterEach(() => {
  cleanup();
  localStorage.clear();
});
