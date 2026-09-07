const LFX_HOST = 'zoom-lfx.platform.linuxfoundation.org';

export function lfxInviteUrl(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== LFX_HOST) return null;
    if (!parsed.searchParams.has('invite')) {
      parsed.searchParams.set('invite', 'true');
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function eventInviteUrl(event) {
  if (!event) return null;
  return (
    lfxInviteUrl(event.url) ||
    lfxInviteUrl(event.location) ||
    lfxInviteUrl(event.extendedProps?.location) ||
    lfxInviteUrl(event.extendedProps?.url)
  );
}
