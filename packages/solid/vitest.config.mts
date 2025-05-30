/// <reference types="vitest" />
/// <reference types="vite/client" />
import path from 'path';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  ssr: {
    noExternal: ['solid-js', '@solid'],
  },
  server: {
    port: 3001,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@floating-ui/utils/dom': path.resolve(
        __dirname,
        '../utils/src/dom.ts',
      ),
      '@floating-ui/react/utils': path.resolve(
        __dirname,
        '../react/utils/src/index.ts',
      ),
      '@floating-ui/utils': path.resolve(__dirname, '../utils/src/index.ts'),
      '@floating-ui/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@floating-ui/dom': path.resolve(__dirname, '../dom/src/index.ts'),
      '@floating-ui/react-dom': path.resolve(
        __dirname,
        '../react-dom/src/index.ts',
      ),
      '@floating-ui/react': path.resolve(__dirname, '../react/src/index.ts'),
      '@floating-ui/vue': path.resolve(__dirname, '../vue/src/index.ts'),
    },
  },
  define: {
    __DEV__: true,
  },
  optimizeDeps: {include: ['solid-js', '@solid*']},
  test: {
    environment: 'jsdom',

    globals: true,
    testTransformMode: {web: ['/.[jt]sx?$/']},
    // transformMode: {web: [/.[jt]sx?$/]},
    deps: {
      inline: [/solid-js/, /@solid/],
    },
  },
});
