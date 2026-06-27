export const BASE_TILE_PX = 16;
export const PIXEL_SCALE = 3;
export const TILE_SIZE = BASE_TILE_PX * PIXEL_SCALE; // 48
export const GRID_COLS = 12;
export const GRID_ROWS = 10;

export const GAME_WIDTH = TILE_SIZE * GRID_COLS;
export const GAME_HEIGHT = TILE_SIZE * GRID_ROWS;

export enum Tile {
  Wasteland = "wasteland",
  Grass = "grass",
  Tree = "tree",
}

/** Texture keys built at runtime in {@link GameScene}. */
export const TEX = {
  wastelandA: "wasteland_a",
  wastelandB: "wasteland_b",
  grassA: "grass_a",
  grassB: "grass_b",
  tree: "tree",
  player: "player",
  creature: "creature",
} as const;

/** Base colors used to generate the terrain tile textures. */
export const TERRAIN = {
  wasteland: { base: 0x8a7551, dark: 0x6b5a3c, light: 0x9c895f },
  grass: { base: 0x57c357, dark: 0x3f9e44, light: 0x7ee07a },
} as const;

export const HUD_TEXT_COLOR = "#ffffff";
