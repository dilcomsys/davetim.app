import { describe, expect, it } from 'vitest';

import { encodeCsv, parseCsv } from '@/lib/csv-codec';

describe('CSV helpers', () => {
  it('parses quoted commas and escaped quotes', () => {
    expect(parseCsv('Ad,Not\r\n"Ada, Deniz","Merhaba ""Davetim"""')).toEqual([
      ['Ad', 'Not'],
      ['Ada, Deniz', 'Merhaba "Davetim"'],
    ]);
  });

  it('neutralizes spreadsheet formulas on export', () => {
    expect(encodeCsv([['=HYPERLINK("https://bad.example")', '+SUM(1,1)']])).toBe(
      '"\'=HYPERLINK(""https://bad.example"")","\'+SUM(1,1)"',
    );
  });
});
