import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { encodeCsv } from '@/lib/csv-codec';

export { encodeCsv, parseCsv } from '@/lib/csv-codec';

export async function shareCsv(filename: string, rows: string[][]) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Dosya paylaşımı bu cihazda kullanılamıyor.');
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const file = new File(Paths.cache, `${Date.now()}-${safeName}`);
  file.create();
  file.write(`\uFEFF${encodeCsv(rows)}`);
  await Sharing.shareAsync(file.uri, { dialogTitle: 'CSV dosyasını paylaş', mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
}
