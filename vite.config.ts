import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/truth-table/' : '/',
  build: { target: 'es2022' },
}));
