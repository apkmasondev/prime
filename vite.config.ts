import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project sites are served from /<repo>/. CI reads the real path
// from the Pages API, which may arrive without a trailing slash; Vite needs one.
const base = `${(process.env.BASE_PATH ?? '/').replace(/\/*$/, '')}/`;

/**
 * Social scrapers do not resolve relative image URLs reliably, so the absolute
 * origin is stamped in at build time. CI passes the Pages URL; locally the
 * placeholder collapses to a relative path, which is right for previewing.
 *
 * The scheme is forced to https for anything that is not a local host. Pages
 * reports a custom domain's URL as http until HTTPS enforcement is recorded
 * against it, and an http image reference on a page served over https is both
 * mixed content and something a scraper is entitled to refuse.
 */
function absoluteSiteUrl(raw: string | undefined): string {
  if (!raw) return './';
  const trimmed = `${raw.replace(/\/*$/, '')}/`;
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(trimmed);
  return local ? trimmed : trimmed.replace(/^http:\/\//, 'https://');
}

const siteUrl = absoluteSiteUrl(process.env.SITE_URL);

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
