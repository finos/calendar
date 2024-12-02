import { tagUrlPattern, urlPattern } from './regex';

export function extractUrls(text) {
  return text.match(tagUrlPattern) || [];
}

export function extractAnchors(text) {
  return text.match(urlPattern) || [];
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
