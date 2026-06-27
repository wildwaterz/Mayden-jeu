import Phaser from "phaser";

/**
 * Maps a single character used in pixel-art grids to a color, or `null` for a
 * transparent pixel. Defining sprites as small text grids keeps all art in code
 * (no binary asset files), so it's easy to tweak by hand or with AI agents.
 */
export type Palette = Record<string, number | null>;

function colorToCss(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}

/**
 * Builds a Phaser texture from a pixel-art grid. Rows may be ragged (shorter
 * rows are padded with transparent pixels on the right).
 */
export function drawSpriteTexture(
  scene: Phaser.Scene,
  key: string,
  art: readonly string[],
  palette: Palette,
  pixelScale: number,
): void {
  if (scene.textures.exists(key)) return;

  const rows = art.length;
  const cols = art.reduce((max, row) => Math.max(max, row.length), 0);

  const canvas = document.createElement("canvas");
  canvas.width = cols * pixelScale;
  canvas.height = rows * pixelScale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  for (let y = 0; y < rows; y++) {
    const row = art[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (color == null) continue;
      ctx.fillStyle = colorToCss(color);
      ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
    }
  }

  scene.textures.addCanvas(key, canvas);
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Builds a 16x16 terrain tile texture: a flat base color with deterministic
 * speckles of darker/lighter shades to give a hand-placed pixel-art feel.
 */
export function drawTerrainTile(
  scene: Phaser.Scene,
  key: string,
  base: number,
  dark: number,
  light: number,
  pixelScale: number,
  seed: number,
): void {
  if (scene.textures.exists(key)) return;

  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE * pixelScale;
  canvas.height = SIZE * pixelScale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = colorToCss(base);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rng = makeRng(seed);
  const speckle = (count: number, color: number) => {
    ctx.fillStyle = colorToCss(color);
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rng() * SIZE);
      const y = Math.floor(rng() * SIZE);
      ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
    }
  };

  speckle(22, dark);
  speckle(12, light);

  scene.textures.addCanvas(key, canvas);
}
