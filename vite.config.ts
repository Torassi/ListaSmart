/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Escuta em todas as interfaces para que o iPhone (e outros aparelhos da
    // rede) acessem http://10.1.1.196:5173 — não só o PC em localhost.
    host: '0.0.0.0',
    port: 5173,
    // Mesma origem para a API: o cliente chama /api (URL relativa) e o Vite
    // encaminha para o FastAPI. Assim, tanto o PC (localhost) quanto o iPhone
    // (IP da LAN) usam a MESMA origem — sem CORS no navegador e sem depender de
    // "localhost" (que no iPhone seria o próprio celular).
    // As rotas do FastAPI já começam com /api → NÃO usar rewrite.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
