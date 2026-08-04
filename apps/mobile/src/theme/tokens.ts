import { Platform } from 'react-native';

/*
 * Davetim palette, drawn from İznik tilework — the ornament already found on
 * Turkish wedding and engagement stationery: a porcelain body, cobalt outline,
 * turquoise fill, and the red the potters called Armenian bole.
 *
 * The role names are unchanged, so every screen picked up the new palette
 * without edits. apps/landing/src/index.css holds the same values as CSS
 * custom properties; change both together or the two surfaces drift.
 *
 * Naming trap, kept rather than renamed across twenty screens: `primary` is
 * the bole red and is used for emphasis and the one destructive control.
 * `secondary` is the cobalt that carries every primary button, link and icon.
 * Reach for `secondary` when you want the action colour.
 */
export const colors = {
  canvas: '#FAF8F3',
  surface: '#FFFFFF',
  surfaceWarm: '#F2EDE4',
  primary: '#C0362C',
  primaryText: '#A22B22',
  primaryPressed: '#A22B22',
  secondary: '#1B3FA0',
  secondarySoft: '#E3E9FA',
  accent: '#1E8E9E',
  accentSoft: '#DFF3F3',
  gold: '#B08341',
  plum: '#142E77',
  ink: '#171A2B',
  inkMuted: '#555B6D',
  border: '#DED4C4',
  success: '#1E7A52',
  successSoft: '#E2F1EA',
  warning: '#8A6320',
  warningSoft: '#F7EEDC',
  dangerSoft: '#F3DCD9',
  onPlum: '#DCE4FA',
  white: '#FFFFFF',

  /*
   * Editor chrome, and the only dark surface in the app. A design canvas needs a
   * neutral mat around it — a porcelain page floating on porcelain gives you no
   * read on how the invitation will actually look. These are the İznik cobalt
   * taken down to mat-board darkness rather than a generic grey, so the editor
   * still belongs to the same product.
   */
  workspace: '#101C3D',
  workspaceRaised: '#1B2B57',
  workspaceBorder: '#2C3F73',
  onWorkspace: '#EEF2FD',
  onWorkspaceMuted: '#9AA9D2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const typography = {
  body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'system-ui' }),
  bodyMedium: Platform.select({ ios: 'Avenir Next Medium', android: 'sans-serif-medium', default: 'system-ui' }),
  // Matches the landing page's --display stack. Iowan Old Style ships with
  // iOS and has the engraved-stationery feel Georgia lacks.
  display: Platform.select({ ios: 'Iowan Old Style', android: 'serif', default: 'Palatino' }),
} as const;

// The engraved label: small, capitalised, widely tracked. The landing page
// repeats the same treatment, so eyebrows read as one system across surfaces.
export const engraved = {
  fontFamily: Platform.select({ ios: 'Avenir Next Medium', android: 'sans-serif-medium', default: 'system-ui' }),
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 1.6,
  textTransform: 'uppercase',
} as const;

export const shadow = {
  shadowColor: '#142E77',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 18,
  elevation: 3,
} as const;
