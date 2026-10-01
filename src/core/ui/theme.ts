/**
 * Colours and text styles of the shared UI, taken from the client's mockups.
 * Change the look of every game here.
 */
export const COLORS = {
  background: 0x0b3d6b,
  panel: 0xffffff,
  panelBorder: 0xb9dff5,
  muted: 0x8d99ae,
  star: 0xffd166,
  /** Header status / score badges. */
  badge: 0x1f4e9c,
  /** 「お題」 card. */
  promptCard: 0xfff6dc,
  promptBorder: 0xf2c14e,
  promptLabel: 0xf5a623,
  /** 「あそびかた」 card. */
  howToCard: 0xfdeaf1,
  howToBorder: 0xf28bb0,
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

const bold = (fontSize: number, color: string) =>
  ({ fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: `${fontSize}px`, color }) as const;

export const TEXT = {
  /** Game title in the header: blue with a white edge, as in the mockups. */
  title: { ...bold(96, COLORS.textTitle), stroke: '#ffffff', strokeThickness: 14 },
  /** Start-screen title on the background picture. */
  startTitle: { ...bold(120, COLORS.textTitle), stroke: '#ffffff', strokeThickness: 18 },
  subtitle: bold(38, COLORS.textDark),
  badgeLabel: bold(30, COLORS.textLight),
  badgeValue: bold(40, COLORS.textLight),
  scoreValue: bold(64, COLORS.scoreValue),
  cardLabel: bold(38, COLORS.textLight),
  cardText: bold(54, COLORS.textDark),
  howToText: bold(40, COLORS.textDark),
  footer: bold(42, COLORS.textDark),
  footerStar: bold(52, '#ffc93c'),
  bubbleTitle: bold(72, COLORS.highlight),
  bubbleLine: bold(40, COLORS.textDark),
  banner: { ...bold(150, COLORS.textLight), stroke: '#e76f51', strokeThickness: 18 },
} as const;
