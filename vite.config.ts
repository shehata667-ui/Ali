import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function serveApkPlugin(): Plugin {
  return {
    name: 'serve-apk-and-zip-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/TikTokStudio.apk' || req.url.startsWith('/TikTokStudio.apk?'))) {
          const apkPath = path.resolve(__dirname, 'public/TikTokStudio.apk');
          if (fs.existsSync(apkPath)) {
            const stat = fs.statSync(apkPath);
            res.writeHead(200, {
              'Content-Type': 'application/vnd.android.package-archive',
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename="TikTokStudio.apk"',
              'Cache-Control': 'no-cache',
            });
            fs.createReadStream(apkPath).pipe(res);
            return;
          }
        }
        if (req.url && (req.url === '/TikTokStudio-Android-Project.zip' || req.url.startsWith('/TikTokStudio-Android-Project.zip?'))) {
          const zipPath = path.resolve(__dirname, 'public/TikTokStudio-Android-Project.zip');
          if (fs.existsSync(zipPath)) {
            const stat = fs.statSync(zipPath);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename="TikTokStudio-Android-Project.zip"',
              'Cache-Control': 'no-cache',
            });
            fs.createReadStream(zipPath).pipe(res);
            return;
          }
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/TikTokStudio.apk' || req.url.startsWith('/TikTokStudio.apk?'))) {
          const apkPath = path.resolve(__dirname, 'dist/TikTokStudio.apk');
          if (fs.existsSync(apkPath)) {
            const stat = fs.statSync(apkPath);
            res.writeHead(200, {
              'Content-Type': 'application/vnd.android.package-archive',
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename="TikTokStudio.apk"',
              'Cache-Control': 'no-cache',
            });
            fs.createReadStream(apkPath).pipe(res);
            return;
          }
        }
        if (req.url && (req.url === '/TikTokStudio-Android-Project.zip' || req.url.startsWith('/TikTokStudio-Android-Project.zip?'))) {
          const zipPath = path.resolve(__dirname, 'dist/TikTokStudio-Android-Project.zip');
          if (fs.existsSync(zipPath)) {
            const stat = fs.statSync(zipPath);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename="TikTokStudio-Android-Project.zip"',
              'Cache-Control': 'no-cache',
            });
            fs.createReadStream(zipPath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      serveApkPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'TikTokStudio.apk', 'TikTokStudio-Android-Project.zip'],
        manifest: {
          id: '/',
          name: 'TikTok Video Studio',
          short_name: 'TikTokStudio',
          description: 'استوديو احترافي لتجهيز ومعالجة فيديوهات تيك توك 9:16 بجودة عالية وثبات إطارات فائق',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
