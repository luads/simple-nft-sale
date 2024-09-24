import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: false,
      },
    }),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      jsbi: path.resolve(__dirname, '.', 'node_modules', 'jsbi', 'dist', 'jsbi-cjs.js'),
    },
    conditions: ['default'],
  },
});
