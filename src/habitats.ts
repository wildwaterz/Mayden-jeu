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
  /** Short French lines the creature occasionally says while idling. */
  wishes: ReadonlyArray<string>;
  /** A fulfillable mini-request: place this tile near the creature. */
  requestTile: Tile;
  /** French prompt shown when the creature makes its request. */
  requestText: string;
  /** French thank-you shown when the request is fulfilled. */
  thanksText: string;
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
    wishes: ["J'adore les arbres !", "Encore plus d'herbe, s'il te plaît !"],
    requestTile: Tile.Tree,
    requestText: "Plante un arbre près de moi !",
    thanksText: "Merci pour l'arbre !",
  },
  {
    id: "etang",
    name: "Étang paisible",
    creatureName: "Carapuce",
    creatureBase: 0x6fb6e8,
    creatureDark: 0x3a78c0,
    center: Tile.Water,
    required: [{ tile: Tile.Grass, count: 2 }],
    wishes: ["L'eau est si fraîche !", "Je veux un plus grand étang !"],
    requestTile: Tile.Water,
    requestText: "J'aimerais plus d'eau près de moi !",
    thanksText: "Merci pour l'eau !",
  },
  {
    id: "clairiere",
    name: "Clairière ensoleillée",
    creatureName: "Pikachu",
    creatureBase: 0xf5d04a,
    creatureDark: 0xc99a1e,
    center: Tile.Grass,
    required: [{ tile: Tile.Tree, count: 3 }],
    wishes: ["Quelle belle clairière !", "J'aime le soleil !"],
    requestTile: Tile.Grass,
    requestText: "Fais pousser de l'herbe près de moi !",
    thanksText: "Merci pour l'herbe !",
  },
  {
    id: "prairie",
    name: "Prairie fleurie",
    creatureName: "Papilusion",
    creatureBase: 0xb583e0,
    creatureDark: 0x7d4fb0,
    center: Tile.Flower,
    required: [{ tile: Tile.Flower, count: 2 }],
    wishes: ["Je veux des fleurs !", "Vive les fleurs colorées !"],
    requestTile: Tile.Flower,
    requestText: "Sème des fleurs près de moi !",
    thanksText: "Merci pour les fleurs !",
  },
];

export function creatureTextureKey(id: string): string {
  return `creature_${id}`;
}

const TILE_CENTER_FR: Record<Tile, string> = {
  [Tile.Wasteland]: "de la terre aride",
  [Tile.Grass]: "de l'herbe",
  [Tile.Tree]: "un arbre",
  [Tile.Water]: "de l'eau",
  [Tile.Flower]: "une fleur",
};

const TILE_PLURAL_FR: Record<Tile, string> = {
  [Tile.Wasteland]: "cases de terre",
  [Tile.Grass]: "cases d'herbe",
  [Tile.Tree]: "arbres",
  [Tile.Water]: "cases d'eau",
  [Tile.Flower]: "fleurs",
};

/** Short French phrase for what a creature wants placed next to it. */
export const TILE_WISH_FR: Record<Tile, string> = {
  [Tile.Wasteland]: "de la terre",
  [Tile.Grass]: "de l'herbe",
  [Tile.Tree]: "un arbre",
  [Tile.Water]: "de l'eau",
  [Tile.Flower]: "des fleurs",
};

/** Human-readable French build recipe, generated from the habitat data. */
export function describeHabitat(def: HabitatDef): string {
  const reqs = def.required
    .map((r) => `${r.count} ${TILE_PLURAL_FR[r.tile]}`)
    .join(" et ");
  return `place ${TILE_CENTER_FR[def.center]} avec au moins ${reqs} autour`;
}
