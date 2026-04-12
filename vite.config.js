import { defineConfig, normalizePath } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react-swc';
import vitePluginBundleObfuscator from 'vite-plugin-bundle-obfuscator';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { logging, server as wisp } from '@mercuryworkshop/wisp-js/server';
import { createBareServer } from '@tomphttp/bare-server-node';
import { bareModulePath } from '@mercuryworkshop/bare-as-module3';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import dotenv from 'dotenv';
import { createRequire } from 'node:module';
const __dirname = process.cwd();
const require = createRequire(__dirname + '/vite.config.js');

const epoxyPath = normalizePath(
  dirname(require.resolve('@mercuryworkshop/epoxy-transport'))
);

dotenv.config();
const useBare = process.env.BARE === 'false' ? false : true;
const isStatic = process.env.STATIC === 'true';
logging.set_level(logging.NONE);
let bare;

Object.assign(wisp.options, {
  dns_method: 'resolve',
  dns_servers: ['1.1.1.3', '1.0.0.3'],
  dns_result_order: 'ipv4first',
});

const routeRequest = (req, resOrSocket, head) => {
  if (req.url && req.url.startsWith('/wisp/')) return wisp.routeRequest(req, resOrSocket, head);
  if (bare.shouldRoute(req))
    return head ? bare.routeUpgrade(req, resOrSocket, head) : bare.routeRequest(req, resOrSocket);
};

const obf = {
  enable: true,
  autoExcludeNodeModules: true,
  threadPool: true,
  options: {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.3,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'mangled',
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayEncoding: [],
    stringArrayCallsTransform: false,
    stringArrayThreshold: 0.5,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    ignoreImports: true,
  },
};

export default defineConfig(({ command }) => {
  const environment = isStatic ? 'static' : command === 'serve' ? 'dev' : 'stable';

  return {
    plugins: [
      react(),
      vitePluginBundleObfuscator(obf),
      viteStaticCopy({
        targets: [
          { src: [normalizePath(resolve(libcurlPath, '*'))], dest: 'libcurl' },
          { src: [normalizePath(resolve(epoxyPath, '*'))], dest: 'epoxy-raw' },
          { src: [normalizePath(resolve(baremuxPath, '*'))], dest: 'baremux' },
          { src: [normalizePath(resolve(scramjetPath, '*'))], dest: 'scram' },
          ...(useBare ? [{ src: [normalizePath(resolve(bareModulePath, '*'))], dest: 'baremod' }] : []),
          {
            src: [
              normalizePath(resolve(uvPath, 'uv.handler.js')),
              normalizePath(resolve(uvPath, 'uv.client.js')),
              normalizePath(resolve(uvPath, 'uv.bundle.js')),
            ],
            dest: 'uv',
          },
        ]
      }),
      ...(isStatic ? [{
        name: 'replace-cdn',
        transform(code, id) {
          if (id.endsWith('apps.json')) {
            return code
              .replace(/\/assets-fb\//g, 'https://cdn.jsdelivr.net/gh/DogeNetwork/v5-assets/img/server/')
              .replace(/\/assets\/img\//g, 'https://cdn.jsdelivr.net/gh/DogeNetwork/v5-assets/img/');
          }
        },
      }] : []),
      {
        name: 'server',
        apply: 'serve',
        configureServer(server) {
          bare = createBareServer('/seal/');
          if (server.httpServer) server.httpServer.on('upgrade', (req, sock, head) => routeRequest(req, sock, head));
          server.middlewares.use((req, res, next) => routeRequest(req, res) || next());
        },
      },
      {
        name: 'search',
        apply: 'serve',
        configureServer(s) {
          s.middlewares.use('/api/ip/meta', async (req, res, next) => {
            if (req.method !== 'GET') return next();

            const json = (payload, status = 200) => {
              res.statusCode = status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(payload));
            };

            const neutralMeta = {
              timezone: 'UTC',
              latitude: 0,
              longitude: 0,
              city: '',
            };

            try {
              const providers = [
                {
                  url: 'https://ipapi.co/json/',
                  parse: (payload) => ({
                    timezone: String(payload?.timezone || ''),
                    latitude: Number(payload?.latitude),
                    longitude: Number(payload?.longitude),
                    city: String(payload?.city || ''),
                  }),
                },
                {
                  url: 'https://ipwho.is/',
                  parse: (payload) => ({
                    timezone: String(typeof payload?.timezone === 'string' ? payload.timezone : payload?.timezone?.id || ''),
                    latitude: Number(payload?.latitude),
                    longitude: Number(payload?.longitude),
                    city: String(payload?.city || ''),
                  }),
                },
              ];

              const isValid = (meta) =>
                !!meta &&
                Number.isFinite(meta.latitude) &&
                Number.isFinite(meta.longitude) &&
                meta.latitude >= -90 &&
                meta.latitude <= 90 &&
                meta.longitude >= -180 &&
                meta.longitude <= 180;

              for (const provider of providers) {
                try {
                  const response = await fetch(provider.url, { headers: { 'user-agent': 'GhostProxy/1.0' } });
                  if (!response.ok) continue;
                  const data = await response.json();
                  const parsed = provider.parse(data);
                  if (!isValid(parsed)) continue;
                  return json(parsed);
                } catch {
                }
              }

              return json(neutralMeta);
            } catch {
              return json(neutralMeta);
            }
          });

          s.middlewares.use('/return', async (req, res) => {
            const q = new URL(req.url, 'http://x').searchParams.get('q');
            try {
              const r = q && (await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}`));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(r ? await r.json() : { error: 'query parameter?' }));
            } catch (e) {
              res.end(JSON.stringify({ error: 'request failed' }));
            }
          });
        },
      },
      {
        name: 'redirect',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/ds') {
              res.writeHead(302, { Location: 'https://discord.gg/ZBef7HnAeg' });
              res.end();
            } else {
              next();
            }
          });
        },
      },
    ],
    build: {
      target: 'es2022',
      reportCompressedSize: false,
      esbuild: {
        legalComments: 'none',
        treeShaking: true,
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: '[hash].js',
          chunkFileNames: 'chunks/[name].[hash].js',
          assetFileNames: 'assets/[hash].[ext]',
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
            icons: ['lucide', 'lucide-react'],
            analytics: ['react-ga4'],
            progress: ['nprogress']
          }
        },
        treeshake: {
          moduleSideEffects: 'no-external',
        },
      },
      minify: 'esbuild',
      sourcemap: false,
    },
    css: {
      modules: {
        generateScopedName: () =>
          String.fromCharCode(97 + Math.floor(Math.random() * 17)) +
          Math.random().toString(36).substring(2, 8),
      },
    },
    server: {
      host: true,
      port: 5174,
      strictPort: true,
      cors: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:2345',
          changeOrigin: true,
        },
        '/assets/img': {
          target: 'https://dogeub-assets.pages.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/assets\/img/, '/img'),
        },
        '/assets-fb': {
          target: 'https://dogeub-assets.pages.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/assets-fb/, '/img/server'),
        },
      },
    },
    define: {
      __ENVIRONMENT__: JSON.stringify(environment),
      isStaticBuild: isStatic
    },
  };
});