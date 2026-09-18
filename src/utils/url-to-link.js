import { tagUrlPattern, urlPattern } from './regex';

export function extractUrls(text) {
  return text.match(tagUrlPattern) || [];
}

export function extractAnchors(text) {
  return text.match(urlPattern) || [];
}

export function isMeetingJoinUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host === 'zoom-lfx.platform.linuxfoundation.org') {
      return /^\/meeting\//i.test(path);
    }
    if (host === 'zoom.us' || host.endsWith('.zoom.us')) {
      return /^\/(j|w|wc)\//i.test(path);
    }
    return false;
  } catch {
    return false;
  }
}

export function replaceUrlsWithAnchorTags(inputText) {
  const urls = extractUrls(inputText);
  const outputText = urls.reduce((text, url) => {
    const anchorTag = `<a href="${url}">${url}</a>`;
    const isAlreadyAnchorTagged = new RegExp(
      `<a\\s+[^>]*href\\s*=\\s*['"]?${url}['"]?[^>]*>.*?<\\/a>`
    ).test(text);
    return isAlreadyAnchorTagged ? text : text.replace(url, anchorTag);
  }, inputText);
  return outputText;
}

/** Linkify only Zoom / LFX meeting join URLs; leave other text (and URLs) plain. */
export function replaceMeetingJoinUrlsWithAnchorTags(inputText) {
  return String(inputText || '').replace(tagUrlPattern, (url) => {
    // Stop at markup or trailing punctuation the broad URL matcher may include.
    const cleaned = url.replace(/<.*$/s, '').replace(/[),.;]+$/g, '');
    if (!cleaned || !isMeetingJoinUrl(cleaned)) return url;
    return url.replace(cleaned, `<a href="${cleaned}">${cleaned}</a>`);
  });
}
