import type { Palette } from "./pixelArt";

/**
 * Shared palette for the hand-authored pixel sprites below. Edit a color here
 * and every sprite that uses that character updates. `.` is always transparent.
 */
export const PALETTE: Palette = {
  ".": null,
  // tree
  c: 0x3aa54a,
  C: 0x2c8039,
  t: 0x7a4a26,
  T: 0x5e381c,
  // player (pink shapeshifter blob)
  p: 0xff9ad5,
  P: 0xd95fa8,
  e: 0x222831,
  m: 0x8a2f5e,
  // creature (teal)
  q: 0x6fd3e8,
  Q: 0x37a3c0,
};

export const TREE_ART: readonly string[] = [
  "......cccc......",
  "....cccccccc....",
  "...cccccCCccc...",
  "..ccccccccCccc..",
  "..cccccccccccc..",
  ".cccccCcccccccc.",
  ".cccccccccccccc.",
  ".ccccccccccCccc.",
  "..cccccccccccc..",
  "..ccccccccCccc..",
  "...cccccccccc...",
  "......tTtt......",
  "......tTtt......",
  "......tTtt......",
  ".....tttttt.....",
  "................",
];

export const PLAYER_ART: readonly string[] = [
  "................",
  "................",
  ".....PPPPPP.....",
  "...PPppppppPP...",
  "..PppppppppppP..",
  ".PppppppppppppP.",
  ".PppppppppppppP.",
  ".PppeeppppeeppP.",
  ".PppeeppppeeppP.",
  ".PppppppppppppP.",
  ".PppppmppmppppP.",
  "..PppmmmmmmppP..",
  "...PPppppppPP...",
  ".....PPPPPP.....",
  "................",
  "................",
];

// Fallback creature (recolored per habitat) used if a habitat has no bespoke
// sprite in CREATURE_SPRITES below.
export const CREATURE_ART: readonly string[] = [
  ".......QQ.......",
  "......QqqQ......",
  ".....QqqqqQ.....",
  "...QQqqqqqqQQ...",
  "..QqqqqqqqqqqQ..",
  ".QqqqqqqqqqqqqQ.",
  ".QqqeeqqqqeeqqQ.",
  ".QqqeeqqqqeeqqQ.",
  ".QqqqqqqqqqqqqQ.",
  ".QqqqqmmmmqqqqQ.",
  "..QqqqqqqqqqqQ..",
  "...QQqqqqqqQQ...",
  ".....QQQQQQ.....",
  "................",
  "................",
  "................",
];

/**
 * Bespoke, original pixel-art creatures keyed by habitat id. Each has a
 * distinct silhouette (antennae / shell / ears / wings) and its own palette.
 * Chars not present in a creature's palette render transparent.
 * Shared chars: `.`=transparent, `e`=eye, `w`=eye shine.
 */
export interface CreatureSpec {
  art: readonly string[];
  palette: Palette;
}

const EYE = 0x1c2226;
const SHINE = 0xffffff;

export const CREATURE_SPRITES: Record<string, CreatureSpec> = {
  // Forest grub: green body with two pink-tipped antennae.
  foret: {
    palette: { ".": null, o: 0x2e6b34, b: 0x74c95a, h: 0x52a83f, l: 0xa6e88a, e: EYE, w: SHINE, a: 0x2e6b34, t: 0xff9ad5 },
    art: [
      "......t..t......",
      "......a..a......",
      ".....oa..ao.....",
      ".....oooooo.....",
      "....obbbbbbo....",
      "...obbllllbbo...",
      "..obbllllllbbo..",
      "..obwebbbbewbo..",
      "..obeebbbbeebo..",
      "..obbbbbbbbbbo..",
      "..obhbbbbbbhbo..",
      "...obbhhhhbbo...",
      "....obbbbbbo....",
      ".....oooooo.....",
      "................",
      "................",
    ],
  },
  // Water critter: blue body wearing a domed shell.
  etang: {
    palette: { ".": null, o: 0x205f8a, b: 0x6fb6e8, h: 0x4a8fc4, s: 0x356e9a, l: 0xa9dcff, e: EYE, w: SHINE },
    art: [
      "................",
      ".....oooooo.....",
      "...oosssssssoo..",
      "..osshsssshsso..",
      "..osssssssssso..",
      "..obbbbbbbbbbo..",
      ".obbwebbbbewbbo.",
      ".obbeebbbbeebbo.",
      ".obbbbbbbbbbbbo.",
      ".obbbbhhhhbbbbo.",
      "..obbbbbbbbbbo..",
      "..oobbbbbbbboo..",
      "...oo....oo.....",
      "................",
      "................",
      "................",
    ],
  },
  // Spark critter: round yellow body with two pointy ears.
  clairiere: {
    palette: { ".": null, o: 0xb5891e, b: 0xf5d24a, h: 0xd8af30, l: 0xffe98a, e: EYE, w: SHINE, a: 0xc46b2f, k: 0x3a3320 },
    art: [
      "...k........k...",
      "...ko......ok...",
      "...kbo....obk...",
      "...obo....obo...",
      "....oooooooo....",
      "...obbbbbbbbo...",
      "..obblbbbblbbo..",
      "..obwebbbbewbo..",
      "..obeebbbbeebo..",
      "..obbbbaabbbbo..",
      "..obbhbbbbhbbo..",
      "...obbbbbbbbo...",
      "....oooooooo....",
      "................",
      "................",
      "................",
    ],
  },
  // Flutter: purple body with two side wings and antennae.
  prairie: {
    palette: { ".": null, o: 0x5a3a86, b: 0xb583e0, h: 0x8a5fc0, l: 0xd9b6f5, e: EYE, w: SHINE, a: 0xd9a0f0 },
    art: [
      "......o..o......",
      ".....o....o.....",
      "......oooo......",
      "....oobbbboo....",
      "...obbbbbbbbo...",
      "..obbbbbbbbbbo..",
      "aaobbwebbewbboaa",
      "aaobbeebbeebboaa",
      "aaobbbbbbbbbboaa",
      "aaobbbhhhhbbboaa",
      "..obbbbbbbbbbo..",
      "...obbbbbbbbo...",
      "....oobbbboo....",
      "................",
      "................",
      "................",
    ],
  },
};
