/*
 * `event_date` is a Postgres `date`, so it arrives as "2026-09-12" with no time
 * and no zone. `new Date("2026-09-12")` reads that as midnight UTC, and Intl
 * then renders it in the device's zone — which moves the date back a day for
 * anyone west of UTC. A wedding on the 12th showed as the 11th to a user in
 * New York. The parts are read directly instead so a calendar date stays the
 * calendar date wherever the phone happens to be.
 */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: string) {
  const parts = DATE_ONLY.exec(value);
  if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  return new Date(value);
}

export function formatEventDate(value: string | null) {
  if (!value) return 'Tarih eklenmedi';
  const date = parseCalendarDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
