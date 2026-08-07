import type { ReadFileBytes, ReadFileSize } from '@/lib/local-file-types';
import { RemoteDataError } from '@/lib/remote-data';

/*
 * The picker hands back a `blob:` or `data:` URL on web, and `fetch` reads both.
 * No file system is involved, which is why this file exists: the native reader
 * would need one.
 */
export const readFileBytes: ReadFileBytes = async (uri) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`status ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    throw new RemoteDataError('Dosya okunamadı.', error);
  }
};

export const readFileSize: ReadFileSize = async (uri) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) return null;
    return (await response.blob()).size;
  } catch {
    return null;
  }
};
