import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project sites are served from /<repo>/. `BASE_PATH` is supplied by CI;
// local dev and user/organisation pages fall back to root.
const base = process.env.BASE_PATH ?? '/';

/**
 * Social scrapers do not resolve relative image URLs reliably, so the absolute
 * origin is stamped in at build time. CI passes the Pages URL; locally the
 * placeholder collapses to a relative path, which is right for previewing.
 */
const siteUrl = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/?$/, '/') : './';

const stampSiteUrl = {
  name: 'stamp-site-url',
  transformIndexHtml: (html: string) => html.replaceAll('%SITE_URL%', siteUrl),
};

export default defineConfig({
  base,
  plugins: [react(), stampSiteUrl],
  build: {
    target: 'es2022',
    cssTarget: 'safari16',
    assetsInlineLimit: 2048,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
