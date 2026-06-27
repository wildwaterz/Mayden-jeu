import { Tile } from "./constants";

/**
 * A habitat is matched when a "center" tile has enough neighboring tiles of the
 * required types. Adding a new habitat (and the creature it attracts) is a pure
 * data edit — no engine changes needed. Creature sprites are recolored from a
 * single shared pixel-art grid via {@link creatureBase}/{@link creatureDark}.
 */
export interface HabitatDef {
  id: string;
  /** French name of the habitat. */
  name: string;
  /** French name of the creature it attracts. */
  creatureName: string;
  creatureBase: number;
  creatureDark: number;
  /** The tile the matched cell itself must be. */
  center: Tile;
  /** Required counts among the 4 orthogonal neighbors (matched with ">="). */
  required: ReadonlyArray<{ tile: Tile; count: number }>;
}

export const HABITATS: ReadonlyArray<HabitatDef> = [
  {
    id: "foret",
    name: "Forêt ombragée",
    creatureName: "Chenipan",
    creatureBase: 0x86c34a,
    creatureDark: 0x5f9433,
    center: Tile.Tree,
    required: [{ tile: Tile.Grass, count: 4 }],
  },
  {
    id: "etang",
    name: "Étang paisible",
    creatureName: "Carapuce",
    creatureBase: 0x6fb6e8,
    creatureDark: 0x3a78c0,
    center: Tile.Water,
    required: [{ tile: Tile.Grass, count: 2 }],
  },
  {
    id: "clairiere",
    name: "Clairière ensoleillée",
    creatureName: "Pikachu",
    creatureBase: 0xf5d04a,
    creatureDark: 0xc99a1e,
    center: Tile.Grass,
    required: [{ tile: Tile.Tree, count: 3 }],
  },
];

export function creatureTextureKey(id: string): string {
  return `creature_${id}`;
}
