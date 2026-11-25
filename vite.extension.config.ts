import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function chromeExtensionPlugin(): Plugin {
  return {
    name: 'pactacloud-chrome-extension',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist-extension');
      const extDir = path.resolve(__dirname, 'extension');

      // Copiar manifest.json, background.js e íconos
      fs.copyFileSync(path.join(extDir, 'manifest.json'), path.join(outDir, 'manifest.json'));
      fs.copyFileSync(path.join(extDir, 'background.js'), path.join(outDir, 'background.js'));
      fs.cpSync(path.join(extDir, 'icons'), path.join(outDir, 'icons'), { recursive: true });

      // Remover scripts remotos externos (MV3 CSP solo permite script-src 'self')
      const indexPath = path.join(outDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf8');
        const cleaned = html.replace(
          /<script\s+src="https:\/\/accounts\.google\.com\/gsi\/client"[^>]*><\/script>\s*/gi,
          ''
        );
        fs.writeFileSync(indexPath, cleaned, 'utf8');
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), chromeExtensionPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
