export const TILE_SIZE = 48;
export const GRID_COLS = 12;
export const GRID_ROWS = 10;

export const GAME_WIDTH = TILE_SIZE * GRID_COLS;
export const GAME_HEIGHT = TILE_SIZE * GRID_ROWS;

export enum Tile {
  Wasteland = "wasteland",
  Grass = "grass",
  Tree = "tree",
}

export const COLORS = {
  wasteland: 0x6b5a45,
  wastelandAlt: 0x5f4f3c,
  grass: 0x5bbf5a,
  grassAlt: 0x52b152,
  treeTrunk: 0x6b4423,
  treeCanopy: 0x2f8f3a,
  player: 0xff8fce,
  playerOutline: 0xd95fa8,
  creature: 0x7fd4e8,
  creatureOutline: 0x3fa9c4,
  text: "#ffffff",
} as const;
