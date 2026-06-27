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
