import type { FileRef } from './explanation-contract';
const cache = new Map<string, Promise<unknown>>();
export function verifiedJSON<T>(file: FileRef, schema: string): Promise<T> {
  const key = `${file.href}:${file.sha256}`;
  let request = cache.get(key);
  if (!request) {
    request = fetch(file.href)
      .then(async (response) => {
        if (!response.ok) throw new Error('Evidence record unavailable');
        const bytes = await response.arrayBuffer();
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
          .map((v) => v.toString(16).padStart(2, '0'))
          .join('');
        if (hash !== file.sha256) throw new Error('Evidence integrity mismatch');
        const value = JSON.parse(new TextDecoder().decode(bytes));
        if (value.schema !== schema) throw new Error('Evidence schema mismatch');
        return value;
      })
      .catch((error) => {
        cache.delete(key);
        throw error;
      });
    cache.set(key, request);
  }
  return request as Promise<T>;
}
