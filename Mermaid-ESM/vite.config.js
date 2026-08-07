// Vite configuration for the Mermaid Explorer.
// The app entry is ./index.html; the ES module graph under ./src is bundled,
// the local mermaid ESM is split into its own chunk, and the https://esm.sh
// CodeMirror imports are left as external URLs (no bundling).
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the production build can be served from any sub-path.
  base: './',

  // Top-level await (used in src/main.js for mermaid.initialize) needs a
  // modern target; 'esnext' keeps it intact instead of transpiling it away.
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000,
    // NOTE: Do NOT force all of mermaid-11.16.0 into one manualChunk. mermaid's
    // ESM build already lazy-loads each diagram type via dynamic import() of
    // files under dist/chunks, dist/diagrams, etc. Letting Rollup keep those
    // as separate on-demand chunks is what makes the initial load tiny.
  },

  esbuild: {
    target: 'esnext',
  },

  optimizeDeps: {
    esbuildOptions: { target: 'esnext' },
  },

  server: {
    open: true,
  },
});

