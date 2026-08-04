import { describe, expect, it } from 'vitest';

import { supportMailUrl, SUPPORT_ADDRESS } from '@/lib/mailto';

describe('support mail url', () => {
  it('addresses the published support inbox', () => {
    expect(supportMailUrl('Davetim Destek').startsWith(`mailto:${SUPPORT_ADDRESS}?`)).toBe(true);
  });

  // "+" is a literal plus in a mail subject, not a space, so a form-encoded
  // subject arrives as "Davetim+Destek" in the composer.
  it('encodes spaces as %20 rather than +', () => {
    const url = supportMailUrl('Davetim reklam bildirimi');
    expect(url).toContain('subject=Davetim%20reklam%20bildirimi');
    expect(url).not.toContain('+');
  });

  it('carries an optional body', () => {
    expect(supportMailUrl('Konu', 'Cihaz: iPhone')).toContain('body=Cihaz%3A%20iPhone');
  });
});
