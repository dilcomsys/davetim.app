import { afterEach, describe, expect, it, vi } from 'vitest';

import { readFileBytes, readFileSize } from '@/lib/local-file.web';
import { RemoteDataError } from '@/lib/remote-data';

function respondWith(body: Uint8Array) {
  return vi.fn(async () => ({
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    blob: async () => ({ size: body.byteLength }),
    ok: true,
    status: 200,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readFileBytes on the web', () => {
  it('reads the bytes behind a picker URL', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal('fetch', respondWith(bytes));

    await expect(readFileBytes('blob:https://davetim.app/abc')).resolves.toEqual(bytes);
  });

  it('reports a failed read as something the screen can show', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));

    await expect(readFileBytes('blob:missing')).rejects.toBeInstanceOf(RemoteDataError);
  });

  it('does not leak a network failure as a raw error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }));

    await expect(readFileBytes('blob:broken')).rejects.toBeInstanceOf(RemoteDataError);
  });
});

describe('readFileSize on the web', () => {
  it('measures the file', async () => {
    vi.stubGlobal('fetch', respondWith(new Uint8Array(2048)));

    await expect(readFileSize('blob:abc')).resolves.toBe(2048);
  });

  it('gives up quietly rather than failing an upload it could still complete', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }));

    await expect(readFileSize('blob:broken')).resolves.toBeNull();
  });

  it('is null when the URL cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403 })));

    await expect(readFileSize('blob:denied')).resolves.toBeNull();
  });
});
