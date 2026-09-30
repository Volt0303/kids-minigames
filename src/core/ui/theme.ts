/**
 * Colours and fonts used by the shared UI. Change the look of every game here
 * once the art style is approved.
 */
export const COLORS = {
  background: 0x0b3d6b,
  panel: 0xffffff,
  panelBorder: 0x8ecae6,
  accent: 0x2a9d8f,
  muted: 0x8d99ae,
  timer: 0x1d4e89,
  progress: 0xf4a261,
  star: 0xffd166,
  textDark: '#1d3557',
  textLight: '#ffffff',
} as const;

/** Bundled rounded Japanese font (public/fonts, SIL Open Font License), declared in index.html. */
export const FONT_FACE = 'Zen Maru Gothic';
export const FONT_FAMILY = `"${FONT_FACE}", sans-serif`;

export const TEXT = {
  // Dark edge keeps the white title readable on light backgrounds.
  title: {
    fontFamily: FONT_FAMILY,
    fontStyle: 'bold',
    fontSize: '64px',
    color: COLORS.textLight,
    stroke: '#0b3d6b',
    strokeThickness: 12,
  },
  pill: { fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: '52px', color: COLORS.textLight },
  heading: { fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: '56px', color: COLORS.textDark },
  caption: { fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: '60px', color: COLORS.textDark, align: 'center' },
  banner: {
    fontFamily: FONT_FAMILY,
    fontStyle: 'bold',
    fontSize: '150px',
    color: COLORS.textLight,
    stroke: '#e76f51',
    strokeThickness: 18,
  },
} as const;
