import { join } from 'path';
import type { ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { generateWithGroq } from './server/lib/groqHandler.js';

function wrapVercelResponse(res: ServerResponse) {
  const patched = res as ServerResponse & {
    status: (code: number) => {
      json: (data: unknown) => ServerResponse;
      end: () => ServerResponse;
    };
  };

  patched.status = (code: number) => {
    res.statusCode = code;
    return {
      json: (data: unknown) => {
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        res.end(JSON.stringify(data));
        return res;
      },
      end: () => {
        res.end();
        return res;
      },
    };
  };

  return patched;
}

function libraryDevApiPlugin(): Plugin {
  return {
    name: 'library-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/library')) return next();

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.end();
          return;
        }

        try {
          const url = new URL(req.url || '/', 'http://localhost');
          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });

          let body: unknown;
          if (req.method === 'POST' || req.method === 'DELETE') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw) {
              try {
                body = JSON.parse(raw);
              } catch {
                body = raw;
              }
            }
          }

          const handler = (await import('./api/library.js')).default;
          await handler(
            {
              method: req.method,
              url: req.url,
              headers: req.headers,
              query,
              body,
            },
            wrapVercelResponse(res),
          );
        } catch (err) {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'Kütüphane API hatası',
              }),
            );
          }
        }
      });
    },
  };
}

function groqDevApiPlugin(): Plugin {
  return {
    name: 'groq-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/groq')) return next();

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const env = loadEnv(server.config.mode, process.cwd(), '');

        if (req.method === 'GET') {
          const hasKey = Boolean(env.GROQ_API_KEY?.trim());
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: hasKey }));
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Yalnızca POST desteklenir' }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
            systemPrompt?: string;
            userText?: string;
            history?: { role?: string; text?: string }[];
          };

          if (!body?.userText?.trim() || !body?.systemPrompt?.trim()) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'systemPrompt ve userText gerekli' }));
            return;
          }

          const result = await generateWithGroq(body, { apiKey: env.GROQ_API_KEY });

          if (!result.ok) {
            res.statusCode = result.status;
            res.end(JSON.stringify({ error: result.error }));
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({ text: result.text, model: result.model }));
        } catch (err) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Sunucu hatası',
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), libraryDevApiPlugin(), groqDevApiPlugin()],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
  server: {
    watch: {
      ignored: [
        '**/*.rar',
        '**/*.zip',
        '**/*.7z',
        join(process.cwd(), 'public', 'library.rar'),
        /library\.rar$/i,
      ],
    },
  },
});
