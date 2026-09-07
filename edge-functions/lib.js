import { handleIcsRequest } from '../shared/ics-feed.js';

function getEnv(name) {
  const netlify = globalThis.Netlify;
  if (netlify?.env?.get) {
    return netlify.env.get(name);
  }
  return globalThis.Deno?.env?.get(name);
}

export function edgeEnv() {
  return {
    LFX_ICS_URL: getEnv('LFX_ICS_URL'),
    GOOGLE_CUSTOM_ICS_URL: getEnv('GOOGLE_CUSTOM_ICS_URL'),
  };
}

export function serveIcs(kind) {
  return async () => handleIcsRequest(kind, edgeEnv());
}
