import { loadEnv } from 'vite';

import { handleIcsRequest, pathToIcsKind } from './shared/ics-feed.js';
import { handleLfxMeetingsRequest } from './shared/lfx-meetings.js';

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

async function lfxMeetingsMiddleware(req, res, next) {
  const pathname = req.url?.split('?')[0];
  if (pathname !== '/api/lfx-meetings') {
    next();
    return;
  }

  try {
    const response = await handleLfxMeetingsRequest(
      `http://localhost${req.url}`
    );
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.end(await response.text());
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({ error: err.message || 'LFX meetings proxy failed' })
    );
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
        lfxMeetingsMiddleware(req, res, next)
      );
      server.middlewares.use((req, res, next) =>
        icsMiddleware(req, res, next, resolveEnv)
      );
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) =>
        lfxMeetingsMiddleware(req, res, next)
      );
      server.middlewares.use((req, res, next) =>
        icsMiddleware(req, res, next, resolveEnv)
      );
    },
  };
}
