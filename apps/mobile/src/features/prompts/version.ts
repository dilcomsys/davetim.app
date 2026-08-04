/*
 * Semantic-ish version comparison for the update gate.
 *
 * `Application.nativeApplicationVersion` is whatever was put in app.json, and
 * the release row is typed by a human into a table. Comparing those as strings
 * gets "1.10.0" < "1.9.0" wrong, which would either nag everyone on the newest
 * build or let an unsupported build through — the two failure modes that matter
 * most for a forced update.
 *
 * Anything the parser cannot read compares as "no opinion" rather than
 * guessing: a malformed row must never lock a user out of the app.
 */
const VERSION_PATTERN = /^\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/;

export function parseVersion(value: string | null | undefined): [number, number, number] | null {
  if (!value) return null;
  const match = VERSION_PATTERN.exec(value);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

/**
 * -1 when `left` is older, 0 when equal, 1 when newer, and `null` when either
 * side is unreadable.
 */
export function compareVersions(left: string | null | undefined, right: string | null | undefined): number | null {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return 0;
}

export function isOlderThan(current: string | null | undefined, target: string | null | undefined) {
  return compareVersions(current, target) === -1;
}
