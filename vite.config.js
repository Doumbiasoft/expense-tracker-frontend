import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import svgr from '@svgr/rollup';

const SRC_JS_RE = /\/src\/.*\.js$/;

// Components live in .js files with JSX. In dev and tests the `oxc.lang`
// option below covers that, but the production build's native transform
// always parses .js as plain JS, so compile the JSX first for the build.
const compileSrcJsJsx = {
  name: 'compile-src-js-jsx',
  apply: 'build',
  enforce: 'pre',
  async transform(code, id) {
    if (!SRC_JS_RE.test(id)) return null;
    const { code: out, map } = await transformWithOxc(code, id, {
      lang: 'jsx',
      jsx: { runtime: 'automatic' },
    });
    return { code: out, map };
  },
};

export default defineConfig({
  resolve: {
    alias: {
      src: resolve(import.meta.dirname, 'src'),
    },
  },
  oxc: {
    lang: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: { '.js': 'jsx' },
    },
  },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  },
  plugins: [compileSrcJsJsx, svgr(), react()],
  // Keep the pre-Vite 8 CommonJS default-import behavior: older CJS packages
  // such as feather-icons-react otherwise import as an object, not a component.
  legacy: { inconsistentCjsInterop: true },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    exclude: ['**/node_modules/**', '**/.{idea,git,trunk}/**'],
  },
});
