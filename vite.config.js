import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    rollupOptions: {
      input: {
        storefront: 'index.html',
        admin: 'admin.html'
      }
    }
  },
  test: { environment: 'node' }
});
