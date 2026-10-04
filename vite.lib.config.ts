import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'iris-ui' },
    emptyOutDir: false,
    rollupOptions: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  },
});
