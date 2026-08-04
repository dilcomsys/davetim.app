import { afterEach, describe, expect, it } from 'vitest';

import { buildPublicStorageUrl, resolveTemplateAssetUrl } from '@/features/templates/template-image';

const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

afterEach(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
});

describe('template image urls', () => {
  it('builds a public object url from a bucket-relative path', () => {
    expect(buildPublicStorageUrl('https://project.supabase.co', 'templates', 'wedding/classic.jpg')).toBe(
      'https://project.supabase.co/storage/v1/object/public/templates/wedding/classic.jpg',
    );
  });

  it('tolerates a trailing slash on the project url', () => {
    expect(buildPublicStorageUrl('https://project.supabase.co/', 'templates', 'wedding/classic.jpg')).toBe(
      'https://project.supabase.co/storage/v1/object/public/templates/wedding/classic.jpg',
    );
  });

  it('encodes path segments without encoding the separators', () => {
    expect(buildPublicStorageUrl('https://project.supabase.co', 'templates', 'düğün/klasik görsel.jpg')).toBe(
      'https://project.supabase.co/storage/v1/object/public/templates/d%C3%BC%C4%9F%C3%BCn/klasik%20g%C3%B6rsel.jpg',
    );
  });

  it('resolves the storage paths the web editor saved', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    expect(resolveTemplateAssetUrl('wedding/classic.jpg')).toBe(
      'https://project.supabase.co/storage/v1/object/public/templates/wedding/classic.jpg',
    );
  });

  it('leaves absolute urls untouched', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    expect(resolveTemplateAssetUrl('https://images.example.com/a.jpg')).toBe('https://images.example.com/a.jpg');
  });

  it('returns null for missing paths', () => {
    expect(resolveTemplateAssetUrl(null)).toBeNull();
    expect(resolveTemplateAssetUrl('')).toBeNull();
  });
});
