import { loadEnv } from 'vite';

import { handleIcsRequest, pathToIcsKind } from './shared/ics-feed.js';

async function icsMiddleware(req, res, next, getEnv) {
  const pathname = req.url?.split('?')[0];
  const kind = pathToIcsKind(pathname);
  if (!kind) {
    next();
    return;
  }

  try {
    const response = await handleIcsRequest(kind, getEnv());
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.end(await response.text());
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(err.message || 'ICS proxy failed');
  }
}

export function icsFeedsPlugin({ env, mode, root }) {
  const resolveEnv = () => ({
    ...env,
    ...loadEnv(mode || 'development', root || process.cwd(), ''),
  });

  return {
    name: 'ics-feeds',
    configureServer(server) {
      server.middlewares.use((req, res, next) =>
        icsMiddleware(req, res, next, resolveEnv)
      );
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) =>
        icsMiddleware(req, res, next, resolveEnv)
      );
    },
  };
}
