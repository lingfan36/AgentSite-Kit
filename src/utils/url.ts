export function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url.replace(/\/+$/, '');
}

export function isSameOrigin(base: string, target: string): boolean {
  try {
    return new URL(base).origin === new URL(target).origin;
  } catch {
    return false;
  }
}

export function urlToId(url: string): string {
  return Buffer.from(url).toString('base64url');
}
