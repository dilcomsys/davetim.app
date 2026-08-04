import { describe, expect, it } from 'vitest';

import { templateCategoryLabel } from '@/features/templates/template-categories';

describe('templateCategoryLabel', () => {
  it('translates the slugs the catalogue actually uses', () => {
    expect(templateCategoryLabel('wedding')).toBe('Düğün');
    expect(templateCategoryLabel('engagement')).toBe('Nişan');
  });

  it('ignores casing and stray whitespace on the stored value', () => {
    expect(templateCategoryLabel(' Wedding ')).toBe('Düğün');
  });

  // A slug added to the catalogue before it is added here should still read as
  // a word on the chip rather than as a raw token.
  it('title-cases an unknown slug instead of showing it raw', () => {
    expect(templateCategoryLabel('save_the_date')).toBe('Save the date');
    expect(templateCategoryLabel('ısınma')).toBe('Isınma');
  });

  it('falls back to a name for an empty category', () => {
    expect(templateCategoryLabel('  ')).toBe('Diğer');
  });
});
