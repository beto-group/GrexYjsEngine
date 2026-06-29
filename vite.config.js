import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // Keep readable for now while we build
    lib: {
      entry: 'src/index.jsx',
      name: 'GrexYjsEngine',
      formats: ['es'],
      fileName: () => 'bundle.es.js'
    },
    rollupOptions: {}
  }
});
