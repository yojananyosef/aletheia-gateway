export function cacheBust(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}v=${__BUILD_ID__}`;
}
