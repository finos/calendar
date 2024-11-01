export const htmlRegex = /<\/*html-blob>/;
export const urlPattern = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>.*?<\/a>/g;
export const tagUrlPattern = /(?<!href\s*=\s*["'])\bhttps?:\/\/\S+\b/g;
