function safeSpreadsheetValue(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function encodeCsv(rows: string[][]) {
  return rows.map((row) => row.map((value) => {
    const safe = safeSpreadsheetValue(value);
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  }).join(',')).join('\r\n');
}

export function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];

    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('CSV dosyasında kapanmamış tırnak işareti var.');
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
