/*
 * App Store and Google Play badges — v2.
 *
 * Instead of putting all text inside SVG <text> elements (which render
 * inconsistently across browsers and platforms), badges now use a hybrid
 * approach: the store icon is an inline SVG, and the label text is plain
 * HTML styled with CSS. This ensures font rendering is pixel-perfect
 * everywhere.
 *
 * Until a listing exists the badge shows a "coming soon" overlay with a
 * subtle pulse, because a badge that looks live and goes nowhere is worse
 * than one that says it is not ready yet.
 */

type BadgeProps = {
  href?: string;
  pendingLabel: string;
};

function BadgeShell({
  children,
  href,
  label,
  pending,
}: {
  children: React.ReactNode;
  href?: string;
  label: string;
  pending: boolean;
}) {
  const cls = `store-badge${pending ? ' store-badge--pending' : ''}`;

  if (!href) {
    return (
      <span className={cls} aria-label={`${label} — çok yakında`}>
        {children}
      </span>
    );
  }

  return (
    <a className={cls} href={href} rel="noreferrer" aria-label={label}>
      {children}
    </a>
  );
}

/* ---- Apple icon (official proportions, simplified) ---- */
function AppleIcon() {
  return (
    <svg
      viewBox="0 0 20 24"
      width="17"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      className="store-badge-icon">
      <path d="M17.05 12.54c-.02-2.52 2.06-3.73 2.15-3.79a4.67 4.67 0 0 0-3.68-1.99c-1.55-.16-3.06.93-3.85.93-.8 0-2.01-.91-3.32-.89a4.9 4.9 0 0 0-4.13 2.52c-1.78 3.08-.45 7.6 1.26 10.09.85 1.23 1.86 2.59 3.17 2.54 1.28-.05 1.76-.82 3.3-.82 1.54 0 1.98.82 3.32.79 1.38-.02 2.25-1.23 3.08-2.47.99-1.42 1.38-2.8 1.4-2.87-.03-.01-2.68-1.03-2.7-4.04zM14.55 4.82A4.05 4.05 0 0 0 15.5.87a4.14 4.14 0 0 0-2.68 1.39 3.85 3.85 0 0 0-.97 2.82 3.42 3.42 0 0 0 2.7-1.26z" />
    </svg>
  );
}

/* ---- Google Play icon (official four-colour triangle) ---- */
function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 26"
      width="18"
      height="20"
      aria-hidden="true"
      className="store-badge-icon">
      <path fill="#00d3ff" d="M1.57 0C.7.52.15 1.48.15 2.72v20.56c0 1.24.55 2.2 1.42 2.72L14.3 13 1.57 0z" />
      <path fill="#00f076" d="M18.64 8.68L5.44.5l12.2 7c.42.24.73.55.94.9l-9.28 4.6 9.34-4.32z" />
      <path fill="#ffc900" d="M22.23 11.3c-.46-.7-1.18-1.22-2.12-1.76l-1.47-.86-4.34 4.32 4.34 4.32 1.47-.86c.94-.54 1.66-1.06 2.12-1.76.69-1.06.69-2.34 0-3.4z" />
      <path fill="#f43249" d="M5.44 25.5l13.2-7.5-4.34-4.32L1.57 26z" />
    </svg>
  );
}

export function AppStoreBadge({ href, pendingLabel }: BadgeProps) {
  const pending = !href;
  return (
    <BadgeShell href={href} label="App Store'dan indir" pending={pending}>
      <span className="store-badge-inner">
        <AppleIcon />
        <span className="store-badge-text">
          <small>App Store'dan</small>
          <strong>İNDİRİN</strong>
        </span>
      </span>
      {pending && <span className="store-badge-soon">{pendingLabel}</span>}
    </BadgeShell>
  );
}

export function GooglePlayBadge({ href, pendingLabel }: BadgeProps) {
  const pending = !href;
  return (
    <BadgeShell href={href} label="Google Play'den indir" pending={pending}>
      <span className="store-badge-inner">
        <PlayIcon />
        <span className="store-badge-text">
          <small>Şimdi</small>
          <strong>Google Play'de</strong>
        </span>
      </span>
      {pending && <span className="store-badge-soon">{pendingLabel}</span>}
    </BadgeShell>
  );
}
