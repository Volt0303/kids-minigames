/**
 * Colours and text styles of the shared UI, taken from the client's mockups.
 * Change the look of every game here.
 */
export const COLORS = {
  /** Page background outside every panel (light sky blue, per the client's mockup). */
  background: 0xdcf2ff,
  panel: 0xffffff,
  panelBorder: 0xb9dff5,
  /** Header and message bars: white panels with a soft light-blue edge, as in the client's sample. */
  bar: 0xffffff,
  barBorder: 0xc4e3f6,
  fieldBorder: 0xc4e3f6,
  muted: 0x8d99ae,
  star: 0xffd166,
  /** Header status / score badges: blue with a pale edge, values in a darker pill. */
  badge: 0x2b7de9,
  badgeBorder: 0xd6f0ff,
  badgeInset: 0x1b5fc8,
  /** The red × close button. */
  close: 0xf2506e,
  /** 「お題」 card. */
  promptCard: 0xfff6dc,
  promptBorder: 0xe6a21c,
  promptLabel: 0xf5a623,
  /** 「あそびかた」 card. */
  howToCard: 0xfdeaf1,
  howToBorder: 0xe2668f,
  howToLabel: 0xe8547f,
  textDark: '#1d3557',
  textLight: '#ffffff',
  textTitle: '#1c5fc2',
  /** Highlighted words: the thing to find (red) and the action (pink). */
  highlight: '#e5383b',
  action: '#e83e8c',
  scoreValue: '#ffd23f',
} as const;

/** Bundled rounded Japanese font (public/fonts, SIL Open Font License), declared in index.html. */
export const FONT_FACE = 'Zen Maru Gothic';
export const FONT_FAMILY = `"${FONT_FACE}", sans-serif`;
/** Heavy, rounded "pop" lettering (M PLUS Rounded 1c ExtraBold, bundled) for text in picture cards. */
export const POP_FONT_FACE = 'M PLUS Rounded 1c';
export const POP_FONT_FAMILY = `"${POP_FONT_FACE}", "${FONT_FACE}", sans-serif`;

const bold = (fontSize: number, color: string) =>
  ({ fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: `${fontSize}px`, color }) as const;

/** A numeric 0xRRGGBB colour as the CSS hex string Phaser's game config expects. */
export function toCssHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export const TEXT = {
  /** Game title in the header: blue with a white edge, as in the mockups. */
  title: { ...bold(96, COLORS.textTitle), stroke: '#ffffff', strokeThickness: 14 },
  /** Start-screen title on the background picture. */
  startTitle: { ...bold(120, COLORS.textTitle), stroke: '#ffffff', strokeThickness: 18 },
  subtitle: bold(38, COLORS.textDark),
  /** Header badge texts, slightly spaced out so they read easily at a glance. */
  badgeLabel: { ...bold(36, COLORS.textLight), letterSpacing: 4 },
  badgeValue: { ...bold(42, COLORS.textLight), letterSpacing: 4 },
  /** Big yellow number in a badge (seconds left, correct count). */
  badgeNumber: { ...bold(66, COLORS.scoreValue), letterSpacing: 3 },
  scoreValue: bold(64, COLORS.scoreValue),
  cardLabel: bold(38, COLORS.textLight),
  cardText: bold(54, COLORS.textDark),
  howToText: bold(40, COLORS.textDark),
  footer: bold(42, COLORS.textDark),
  footerStar: bold(52, '#ffc93c'),
  bubbleTitle: bold(72, COLORS.highlight),
  bubbleLine: bold(40, COLORS.textDark),
  /** The question in the close-confirmation dialog. */
  dialog: bold(72, COLORS.textDark),
  banner: { ...bold(150, COLORS.textLight), stroke: '#e76f51', strokeThickness: 18 },
  /** Pop lettering in picture cards (e.g. ①'s 「あそびかた」), dark brown as in the mockup. */
  popCard: { fontFamily: POP_FONT_FAMILY, fontStyle: '800', fontSize: '48px', color: '#3a2412' },
} as const;
