import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteCompression()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5175,
    strictPort: true,
    hmr: {
      port: 5175,
      protocol: 'ws',
      host: 'localhost'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // Ensure static assets are properly handled
      output: {
        // Ensure proper asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          // Keep favicon files with their original names
          if (assetInfo.name?.includes('favicon') || assetInfo.name?.includes('icon-')) {
            return `[name][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
});
