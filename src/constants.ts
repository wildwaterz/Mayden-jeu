export const BASE_TILE_PX = 16;
export const PIXEL_SCALE = 3;
export const TILE_SIZE = BASE_TILE_PX * PIXEL_SCALE; // 48
export const GRID_COLS = 12;
export const GRID_ROWS = 10;

/** On-screen touch control bar drawn below the tile grid. */
export const UI_BAR_HEIGHT = 64;

export const GRID_PIXEL_WIDTH = TILE_SIZE * GRID_COLS;
export const GRID_PIXEL_HEIGHT = TILE_SIZE * GRID_ROWS;

export const GAME_WIDTH = GRID_PIXEL_WIDTH;
export const GAME_HEIGHT = GRID_PIXEL_HEIGHT + UI_BAR_HEIGHT;

export enum Tile {
  Wasteland = "wasteland",
  Grass = "grass",
  Tree = "tree",
  Water = "water",
}

/** Texture keys built at runtime in {@link GameScene}. */
export const TEX = {
  wastelandA: "wasteland_a",
  wastelandB: "wasteland_b",
  grassA: "grass_a",
  grassB: "grass_b",
  waterA: "water_a",
  waterB: "water_b",
  tree: "tree",
  player: "player",
} as const;

/** Base colors used to generate the terrain tile textures. */
export const TERRAIN = {
  wasteland: { base: 0x8a7551, dark: 0x6b5a3c, light: 0x9c895f },
  grass: { base: 0x57c357, dark: 0x3f9e44, light: 0x7ee07a },
  water: { base: 0x4aa3e0, dark: 0x2f7fc0, light: 0x8fd0f5 },
} as const;

export const HUD_TEXT_COLOR = "#ffffff";

export const SAVE_KEY = "mayden-jeu:v1";

/** XP needed per level, and XP awarded for actions. */
export const XP_PER_LEVEL = 20;
export const XP_PER_HABITAT = 10;
export const XP_PER_REQUEST = 20;
