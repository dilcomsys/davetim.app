/*
 * The Davetim seal.
 *
 * An engraved monogram inside a hairline ring — the mark a printer would
 * strike on a davetiye. The D is drawn as a path rather than set as text so
 * the web and the React Native build render the identical letterform instead
 * of falling back to whatever serif each platform happens to ship.
 *
 * Restraint is the point. Two rings, one letter, two gold marks on the
 * horizontal axis. Earlier passes added petals, dots and a wax blob and each
 * one made it read as a generic app badge instead of stationery.
 *
 * `tone="light"` inverts it for the navy download card and the footer.
 */

type SealProps = {
  size?: number;
  tone?: 'dark' | 'light';
};

export function Seal({ size = 40, tone = 'dark' }: SealProps) {
  const ring = tone === 'light' ? 'rgba(250, 248, 243, 0.85)' : '#1b3fa0';
  const hairline = tone === 'light' ? 'rgba(250, 248, 243, 0.4)' : 'rgba(27, 63, 160, 0.35)';
  const letter = tone === 'light' ? '#faf8f3' : '#142e77';
  const accent = '#b08341';

  return (
    <svg
      aria-hidden="true"
      className="brand-logo"
      focusable="false"
      height={size}
      role="presentation"
      viewBox="0 0 64 64"
      width={size}>
      <circle cx="32" cy="32" r="30.6" fill="none" stroke={ring} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="26.6" fill="none" stroke={hairline} strokeWidth="0.8" />

      {/* Serif D: bowl, stem and the two slab serifs that finish the stem. */}
      <path
        d="M24 19.6h9.6c8.1 0 13.4 5 13.4 12.4S41.7 44.4 33.6 44.4H24Zm5.8 4.9v15h3.6c4.7 0 7.6-2.9 7.6-7.5s-2.9-7.5-7.6-7.5Z"
        fill={letter}
        fillRule="evenodd"
      />
      <rect x="20.4" y="19.6" width="9.4" height="2.3" fill={letter} />
      <rect x="20.4" y="42.1" width="9.4" height="2.3" fill={letter} />

      {/* Two gold marks on the horizontal axis, the only ornament. */}
      <circle cx="5.4" cy="32" r="1.5" fill={accent} />
      <circle cx="58.6" cy="32" r="1.5" fill={accent} />
    </svg>
  );
}
