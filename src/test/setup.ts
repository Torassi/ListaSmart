import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { installFakeBackend, resetFakeBackend } from './fakeBackend';

// A camada de dados agora fala com a API. Nos testes, um fake backend em memória
// (instalado como mock de `fetch`) responde de forma determinística.
installFakeBackend();

beforeEach(() => {
  resetFakeBackend();
});

// Limpa o DOM renderizado e o localStorage após cada teste (evita vazamento de
// estado entre eles).
afterEach(() => {
  cleanup();
  localStorage.clear();
});
