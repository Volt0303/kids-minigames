import * as Phaser from 'phaser';
import { gameArtKey } from '../../core/assets/catalog';
import type { Rect } from '../../core/logic/rect';
import type { Setting } from './stages';

export const PICTURE_RADIUS = 26;
/** Where the sea's sand starts (share of the picture's height): flat things lie below it. */
export const SAND_TOP = 0.83;
const SEA_PICTURE = gameArtKey('diff', 'picture-sea');
/** Drawn sea (used only without the sea picture): light to deep blue, then sand. */
const SEA = { top: 0x9fe3ff, bottom: 0x2f9fe0, sand: 0xf3dca0, water: 0.82 };
/** The wooden wall behind the sushi table: warm brown, darker downwards, with plank lines. */
const WALL = { top: 0xb27a4e, bottom: 0x6f4428, plank: 0x5a3820, planks: 7 };
const BANDS = 10;
/**
 * The frame, in the design's colours: orange edges around a pale-yellow band whose upper side
 * catches the light (near white) and lower side is deeper yellow (glossy look).
 */
const FRAME = { edge: 0xfa8f06, innerEdge: 0xfea900, band: 0xfef399, shine: 0xfffbe5, shade: 0xfdd865 };
/** How far the frame reaches out from the picture (design units). */
const FRAME_WIDTH = 22;

/**
 * Behind a 間違い探し picture's sprites: the sea picture (or a drawn sea) or the wooden wall of
 * the sushi scene, and the glossy frame around it.
 */
export class PictureBackground {
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly sea?: Phaser.GameObjects.Image;
  private readonly frame: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.fill = scene.add.graphics().setDepth(-30);
    if (scene.textures.exists(SEA_PICTURE)) this.sea = scene.add.image(0, 0, SEA_PICTURE).setDepth(-29);
    this.frame = scene.add.graphics().setDepth(-28);
  }

  draw(setting: Setting, a: Rect): void {
    const g = this.fill.clear();
    this.sea?.setVisible(false);
    if (setting === 'sushi') drawWall(g, a);
    else if (this.sea) cover(this.sea.setVisible(true), a);
    else drawSea(g, a);
    drawFrame(this.frame.clear(), a);
  }
}

/** Fills the picture with `image`, cut evenly at the sides (or top and bottom) to fit. */
function cover(image: Phaser.GameObjects.Image, a: Rect): void {
  const source = image.frame;
  const scale = Math.max(a.width / source.width, a.height / source.height);
  const width = a.width / scale;
  const height = a.height / scale;
  image
    .setCrop((source.width - width) / 2, (source.height - height) / 2, width, height)
    .setScale(scale)
    .setPosition(a.x + a.width / 2, a.y + a.height / 2);
}

/** Soft horizontal bands from `from` to `to` colour, over the picture from `top` to `bottom` (shares). */
function drawBands(g: Phaser.GameObjects.Graphics, a: Rect, colors: [number, number], range: [number, number]): void {
  const from = Phaser.Display.Color.ValueToColor(colors[0]);
  const to = Phaser.Display.Color.ValueToColor(colors[1]);
  const top = a.y + a.height * range[0];
  const band = (a.height * (range[1] - range[0])) / BANDS;
  for (let i = 0; i < BANDS; i++) {
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, BANDS, i);
    const round = (edge: boolean): number => (edge ? PICTURE_RADIUS : 0);
    const isTop = i === 0 && range[0] === 0;
    const isBottom = i === BANDS - 1 && range[1] === 1;
    g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
    g.fillRoundedRect(a.x, top + band * i, a.width, band + (isBottom ? 0 : 1), {
      tl: round(isTop),
      tr: round(isTop),
      bl: round(isBottom),
      br: round(isBottom),
    });
  }
}

function drawSea(g: Phaser.GameObjects.Graphics, a: Rect): void {
  drawBands(g, a, [SEA.top, SEA.bottom], [0, SEA.water]);
  const water = a.height * SEA.water;
  g.fillStyle(SEA.sand).fillRoundedRect(a.x, a.y + water, a.width, a.height - water, {
    tl: 0,
    tr: 0,
    bl: PICTURE_RADIUS,
    br: PICTURE_RADIUS,
  });
}

/** A warm wooden wall: brown bands, darker downwards, with faint vertical plank lines. */
function drawWall(g: Phaser.GameObjects.Graphics, a: Rect): void {
  drawBands(g, a, [WALL.top, WALL.bottom], [0, 1]);
  g.lineStyle(4, WALL.plank, 0.35);
  for (let i = 1; i < WALL.planks; i++) {
    const x = a.x + (a.width * i) / WALL.planks;
    g.lineBetween(x, a.y, x, a.y + a.height);
  }
}

/** A rounded-rectangle line `out` units outside the picture, `dy` units lower. */
function ring(g: Phaser.GameObjects.Graphics, a: Rect, out: number, dy = 0): void {
  g.strokeRoundedRect(a.x - out, a.y - out + dy, a.width + out * 2, a.height + out * 2, PICTURE_RADIUS + out);
}

/** The glossy frame: orange edges, pale-yellow band with a light upper and a deeper lower side. */
function drawFrame(g: Phaser.GameObjects.Graphics, a: Rect): void {
  const mid = FRAME_WIDTH / 2;
  g.lineStyle(FRAME_WIDTH, FRAME.edge);
  ring(g, a, mid);
  g.lineStyle(FRAME_WIDTH - 8, FRAME.band);
  ring(g, a, mid);
  // Shade on the lower side of the band, shine on its upper side (each ring shifted a little).
  g.lineStyle(5, FRAME.shade);
  ring(g, a, mid, 4);
  g.lineStyle(4, FRAME.shine);
  ring(g, a, mid, -4);
  g.lineStyle(4, FRAME.innerEdge);
  ring(g, a, 2);
}
