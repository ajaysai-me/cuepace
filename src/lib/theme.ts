/**
 * Palette: paper, ink, grey, red, brand yellow (plus ink-tinted greys and hairlines).
 * Layout language: friendly marketplace app — white page, big rounded cards,
 * flat surfaces (outlines and fills, no shadows), pill search, bold titles, a red primary action.
 */
export const colors = {
  bg: '#FFFFFF',
  /** Ink at ~4% on paper: tiles, covers, input fills. */
  surface: '#F5F5F5',
  surfaceRaised: '#ECECEC',
  border: 'rgba(10,10,10,0.12)',
  borderStrong: 'rgba(10,10,10,0.28)',
  ink: '#0A0A0A',
  text: '#0A0A0A',
  /** Secondary text, ink at 60% so it stays readable on white. */
  textSecondary: 'rgba(10,10,10,0.6)',
  textMuted: '#8B8B8B',
  /** Brand colour: yellow. Never use it for text or icons on white. */
  primary: '#FFD500',
  onPrimary: '#0A0A0A',
  /** Pale brand yellow for soft fills (icon tiles, pressed states). */
  primarySoft: '#FFF4B8',
  onInk: '#FFFFFF',
  /** Small highlights: badges, the eye-line marker on camera. */
  highlight: '#FFD500',
  link: '#3B5BD9',
  danger: '#E0492A',
  /** Filled heart on liked takes. */
  liked: '#E0492A',
  recording: '#E0492A',
  /** Dark translucent fill for the floating bars over the camera. */
  glass: 'rgba(10,10,10,0.72)',
  glassBorder: 'rgba(255,255,255,0.14)',
};

/**
 * Note colours: Google Keep's palette. All are light, so text stays ink.
 * fg/sub/line keep text, secondary text and outlines readable on each colour.
 */
const LIGHT = { fg: '#0A0A0A', sub: 'rgba(10,10,10,0.6)', line: 'rgba(10,10,10,0.14)', dark: false };
export const noteColors = {
  default: { bg: '#FFFFFF', label: 'Default', ...LIGHT },
  coral: { bg: '#FAAFA8', label: 'Coral', ...LIGHT },
  peach: { bg: '#F39F76', label: 'Peach', ...LIGHT },
  sand: { bg: '#FFF8B8', label: 'Sand', ...LIGHT },
  mint: { bg: '#E2F6D3', label: 'Mint', ...LIGHT },
  sage: { bg: '#B4DDD3', label: 'Sage', ...LIGHT },
  fog: { bg: '#D4E4ED', label: 'Fog', ...LIGHT },
  storm: { bg: '#AECCDC', label: 'Storm', ...LIGHT },
  dusk: { bg: '#D3BFDB', label: 'Dusk', ...LIGHT },
  blossom: { bg: '#F6E2DD', label: 'Blossom', ...LIGHT },
  clay: { bg: '#E9E3D4', label: 'Clay', ...LIGHT },
  chalk: { bg: '#EFEFF1', label: 'Chalk', ...LIGHT },
};

export type NoteColor = keyof typeof noteColors;

/** Colours saved by earlier versions, mapped to their nearest Keep colour. */
const LEGACY: Record<string, NoteColor> = {
  red: 'coral',
  neon: 'sand',
  blue: 'fog',
  navy: 'storm',
  ink: 'dusk',
  grey: 'chalk',
};

export function noteTone(color: string | undefined) {
  const key = (color && (color in noteColors ? color : LEGACY[color])) || 'default';
  return noteColors[key as NoteColor];
}

export function noteBg(color: string | undefined) {
  return noteTone(color).bg;
}

/** Avatar colours (background + letter), all from the palette. */
// Bright colours only: no black or near-black navy.
const AVATAR_COLORS = [
  { bg: '#FFD500', fg: '#0A0A0A' }, // brand yellow
  { bg: '#E0492A', fg: '#FFFFFF' }, // red
  { bg: '#3B5BD9', fg: '#FFFFFF' }, // blue
  { bg: '#F39F76', fg: '#0A0A0A' }, // peach
  { bg: '#B4DDD3', fg: '#0A0A0A' }, // sage
];

/** Picks an avatar colour from a name; the same name always gets the same colour. */
export function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
