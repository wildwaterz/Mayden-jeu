import Phaser from "phaser";
import {
  GRID_COLS,
  GRID_ROWS,
  HUD_TEXT_COLOR,
  PIXEL_SCALE,
  SAVE_KEY,
  TERRAIN,
  TEX,
  TILE_SIZE,
  Tile,
  XP_PER_HABITAT,
  XP_PER_LEVEL,
  XP_PER_REQUEST,
} from "../constants";
import { drawSpriteTexture, drawTerrainTile } from "../pixelArt";
import { CREATURE_ART, PALETTE, PLAYER_ART, TREE_ART } from "../sprites";
import { creatureTextureKey, HABITATS, type HabitatDef } from "../habitats";

type Move = "leafage" | "plant" | "water";

interface PlacedCreature {
  id: string;
  r: number;
  c: number;
}

interface SaveData {
  v: 1;
  tiles: Tile[][];
  player: { r: number; c: number };
  xp: number;
  requestIndex: number;
  creatures: PlacedCreature[];
}

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const MOVE_NAMES: Record<Move, string> = {
  leafage: "Feuillage (fait pousser l'herbe)",
  plant: "Planter un arbre",
  water: "Pistolet à Eau (crée de l'eau)",
};

/**
 * Core gameplay loop inspired by Pokémon Pokopia (texte en français) :
 * on terraforme un monde fané (herbe, arbres, eau) pour bâtir des habitats
 * qui attirent des créatures. Des requêtes guident le joueur et donnent de
 * l'XP pour monter de niveau. La partie est sauvegardée automatiquement.
 */
export class GameScene extends Phaser.Scene {
  private tiles: Tile[][] = [];
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private treeSprites = new Map<string, Phaser.GameObjects.Image>();
  private placedCreatures: PlacedCreature[] = [];
  private satisfiedHabitats = new Set<string>();

  private player!: Phaser.GameObjects.Image;
  private playerCol = Math.floor(GRID_COLS / 2);
  private playerRow = Math.floor(GRID_ROWS / 2);

  private selectedMove: Move = "leafage";
  private xp = 0;
  private requestIndex = 0;

  private hudText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.buildTextures();

    const save = this.loadGame();
    this.initGrid(save);

    this.playerRow = save?.player.r ?? Math.floor(GRID_ROWS / 2);
    this.playerCol = save?.player.c ?? Math.floor(GRID_COLS / 2);
    this.xp = save?.xp ?? 0;
    this.requestIndex = save?.requestIndex ?? 0;

    this.player = this.add.image(0, 0, TEX.player).setDepth(50);
    this.positionPlayer();

    if (save) {
      for (const placed of save.creatures) {
        this.restoreCreature(placed);
      }
    }

    this.hudText = this.add
      .text(8, 8, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: HUD_TEXT_COLOR,
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.toastText = this.add
      .text(GRID_COLS * TILE_SIZE * 0.5, 12, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#fff4b0",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 8, y: 5 },
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setDepth(100)
      .setAlpha(0);

    this.registerInput();
    this.refreshHud();
  }

  // --- Textures ---------------------------------------------------------

  private buildTextures(): void {
    drawTerrainTile(this, TEX.wastelandA, TERRAIN.wasteland.base, TERRAIN.wasteland.dark, TERRAIN.wasteland.light, PIXEL_SCALE, 1337);
    drawTerrainTile(this, TEX.wastelandB, TERRAIN.wasteland.base, TERRAIN.wasteland.dark, TERRAIN.wasteland.light, PIXEL_SCALE, 4242);
    drawTerrainTile(this, TEX.grassA, TERRAIN.grass.base, TERRAIN.grass.dark, TERRAIN.grass.light, PIXEL_SCALE, 7);
    drawTerrainTile(this, TEX.grassB, TERRAIN.grass.base, TERRAIN.grass.dark, TERRAIN.grass.light, PIXEL_SCALE, 99);
    drawTerrainTile(this, TEX.waterA, TERRAIN.water.base, TERRAIN.water.dark, TERRAIN.water.light, PIXEL_SCALE, 21);
    drawTerrainTile(this, TEX.waterB, TERRAIN.water.base, TERRAIN.water.dark, TERRAIN.water.light, PIXEL_SCALE, 55);
    drawSpriteTexture(this, TEX.tree, TREE_ART, PALETTE, PIXEL_SCALE);
    drawSpriteTexture(this, TEX.player, PLAYER_ART, PALETTE, PIXEL_SCALE);

    for (const habitat of HABITATS) {
      drawSpriteTexture(
        this,
        creatureTextureKey(habitat.id),
        CREATURE_ART,
        {
          ".": null,
          q: habitat.creatureBase,
          Q: habitat.creatureDark,
          e: 0x222831,
          m: 0x8a2f5e,
        },
        PIXEL_SCALE,
      );
    }
  }

  // --- Grid setup -------------------------------------------------------

  private initGrid(save: SaveData | null): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      this.tiles[r] = [];
      this.tileImages[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = save?.tiles[r]?.[c] ?? Tile.Wasteland;
        this.tiles[r][c] = tile;
        const image = this.add
          .image(c * TILE_SIZE, r * TILE_SIZE, this.textureForTile(tile, r, c))
          .setOrigin(0, 0);
        this.tileImages[r][c] = image;
        if (tile === Tile.Tree) {
          this.spawnTreeSprite(r, c, `${r},${c}`);
        }
      }
    }
  }

  private restoreCreature(placed: PlacedCreature): void {
    const def = HABITATS.find((h) => h.id === placed.id);
    if (!def) return;
    this.placedCreatures.push(placed);
    this.satisfiedHabitats.add(this.habitatKey(def, placed.r, placed.c));
    this.spawnCreatureSprite(def, placed.r, placed.c);
  }

  private positionPlayer(): void {
    this.player.setPosition(
      this.playerCol * TILE_SIZE + TILE_SIZE / 2,
      this.playerRow * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  // --- Input ------------------------------------------------------------

  private registerInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;

    kb.on("keydown-LEFT", () => this.movePlayer(0, -1));
    kb.on("keydown-RIGHT", () => this.movePlayer(0, 1));
    kb.on("keydown-UP", () => this.movePlayer(-1, 0));
    kb.on("keydown-DOWN", () => this.movePlayer(1, 0));
    kb.on("keydown-A", () => this.movePlayer(0, -1));
    kb.on("keydown-D", () => this.movePlayer(0, 1));
    kb.on("keydown-W", () => this.movePlayer(-1, 0));
    kb.on("keydown-S", () => this.movePlayer(1, 0));

    kb.on("keydown-ONE", () => this.selectMove("leafage"));
    kb.on("keydown-TWO", () => this.selectMove("plant"));
    kb.on("keydown-THREE", () => this.selectMove("water"));

    kb.on("keydown-SPACE", () => this.useMove());
    kb.on("keydown-R", () => this.resetGame());
  }

  private movePlayer(dr: number, dc: number): void {
    this.playerRow = Phaser.Math.Clamp(this.playerRow + dr, 0, GRID_ROWS - 1);
    this.playerCol = Phaser.Math.Clamp(this.playerCol + dc, 0, GRID_COLS - 1);
    this.positionPlayer();
    this.saveGame();
  }

  private selectMove(move: Move): void {
    this.selectedMove = move;
    this.refreshHud();
  }

  private useMove(): void {
    const r = this.playerRow;
    const c = this.playerCol;
    const current = this.tiles[r][c];

    switch (this.selectedMove) {
      case "leafage":
        if (current === Tile.Wasteland) {
          this.applyTile(r, c, Tile.Grass);
        } else {
          this.showToast("Le Feuillage ne marche que sur la terre aride.");
        }
        break;
      case "plant":
        if (current === Tile.Grass) {
          this.applyTile(r, c, Tile.Tree);
        } else if (current === Tile.Tree) {
          this.showToast("Un arbre pousse déjà ici.");
        } else {
          this.showToast("Fais pousser de l'herbe avant de planter un arbre.");
        }
        break;
      case "water":
        if (current === Tile.Grass) {
          this.applyTile(r, c, Tile.Water);
        } else if (current === Tile.Water) {
          this.showToast("Il y a déjà de l'eau ici.");
        } else {
          this.showToast("Le Pistolet à Eau ne marche que sur l'herbe.");
        }
        break;
    }
  }

  private applyTile(r: number, c: number, tile: Tile): void {
    this.setTile(r, c, tile);
    this.checkHabitatsNear(r, c);
    this.saveGame();
  }

  private setTile(r: number, c: number, tile: Tile): void {
    const previous = this.tiles[r][c];
    this.tiles[r][c] = tile;
    this.tileImages[r][c].setTexture(this.textureForTile(tile, r, c));

    const key = `${r},${c}`;
    if (tile === Tile.Tree) {
      this.spawnTreeSprite(r, c, key);
    } else if (previous === Tile.Tree) {
      this.treeSprites.get(key)?.destroy();
      this.treeSprites.delete(key);
    }
  }

  private spawnTreeSprite(r: number, c: number, key: string): void {
    if (this.treeSprites.has(key)) return;
    const cx = c * TILE_SIZE + TILE_SIZE / 2;
    const cy = r * TILE_SIZE + TILE_SIZE / 2;
    const tree = this.add.image(cx, cy, TEX.tree).setOrigin(0.5, 0.6).setDepth(20);
    this.treeSprites.set(key, tree);
  }

  // --- Habitats ---------------------------------------------------------

  private checkHabitatsNear(r: number, c: number): void {
    const cells: Array<[number, number]> = [
      [r, c],
      ...NEIGHBORS.map(([dr, dc]) => [r + dr, c + dc] as [number, number]),
    ];
    for (const [cr, cc] of cells) {
      if (!this.inBounds(cr, cc)) continue;
      for (const def of HABITATS) {
        if (!this.matchesHabitat(def, cr, cc)) continue;
        const key = this.habitatKey(def, cr, cc);
        if (this.satisfiedHabitats.has(key)) continue;
        this.satisfiedHabitats.add(key);
        this.onHabitatBuilt(def, cr, cc);
        break;
      }
    }
  }

  private matchesHabitat(def: HabitatDef, r: number, c: number): boolean {
    if (this.tiles[r][c] !== def.center) return false;
    const counts = new Map<Tile, number>();
    for (const [dr, dc] of NEIGHBORS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!this.inBounds(nr, nc)) continue;
      const t = this.tiles[nr][nc];
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return def.required.every((req) => (counts.get(req.tile) ?? 0) >= req.count);
  }

  private onHabitatBuilt(def: HabitatDef, r: number, c: number): void {
    this.placedCreatures.push({ id: def.id, r, c });
    this.spawnCreatureSprite(def, r, c);

    const request = this.currentRequest();
    if (request && request.id === def.id) {
      this.requestIndex += 1;
      this.addXp(XP_PER_HABITAT + XP_PER_REQUEST);
      this.showToast(
        `Requête accomplie ! ${def.creatureName} est attiré !\n+${XP_PER_HABITAT + XP_PER_REQUEST} XP`,
      );
    } else {
      this.addXp(XP_PER_HABITAT);
      this.showToast(
        `Habitat « ${def.name} » créé !\n${def.creatureName} est attiré ! +${XP_PER_HABITAT} XP`,
      );
    }

    this.refreshHud();
    this.saveGame();
  }

  private spawnCreatureSprite(def: HabitatDef, r: number, c: number): void {
    const cx = c * TILE_SIZE + TILE_SIZE / 2;
    const cy = r * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE * 0.55;
    const creature = this.add
      .image(cx, cy - 14, creatureTextureKey(def.id))
      .setDepth(40)
      .setAlpha(0);

    this.tweens.add({ targets: creature, y: cy, alpha: 1, duration: 450, ease: "Back.Out" });
    this.tweens.add({
      targets: creature,
      y: cy - 6,
      duration: 900,
      delay: 450,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  private habitatKey(def: HabitatDef, r: number, c: number): string {
    return `${def.id}:${r},${c}`;
  }

  // --- Progression ------------------------------------------------------

  private currentRequest(): HabitatDef | null {
    return this.requestIndex < HABITATS.length ? HABITATS[this.requestIndex] : null;
  }

  private level(): number {
    return Math.floor(this.xp / XP_PER_LEVEL) + 1;
  }

  private addXp(amount: number): void {
    const before = this.level();
    this.xp += amount;
    const after = this.level();
    if (after > before) {
      this.time.delayedCall(1100, () =>
        this.showToast(`Niveau supérieur ! Tu es niveau ${after} !`),
      );
    }
  }

  // --- Save / load ------------------------------------------------------

  private saveGame(): void {
    const data: SaveData = {
      v: 1,
      tiles: this.tiles,
      player: { r: this.playerRow, c: this.playerCol },
      xp: this.xp,
      requestIndex: this.requestIndex,
      creatures: this.placedCreatures,
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors (e.g. private mode); the game still works.
    }
  }

  private loadGame(): SaveData | null {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.v !== 1 || !Array.isArray(data.tiles)) return null;
      if (data.tiles.length !== GRID_ROWS || data.tiles[0]?.length !== GRID_COLS) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  private resetGame(): void {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      // Ignore storage errors.
    }
    this.scene.restart();
  }

  // --- HUD --------------------------------------------------------------

  private refreshHud(): void {
    const request = this.currentRequest();
    const requestLine = request
      ? `Requête : crée ${request.name} pour attirer ${request.creatureName}`
      : "Toutes les requêtes sont accomplies ! Bravo !";
    const xpIntoLevel = this.xp % XP_PER_LEVEL;

    this.hudText.setText(
      [
        "Déplacer : flèches / WASD    Agir : ESPACE    Recommencer : R",
        "Capacités : [1] Feuillage  [2] Arbre  [3] Pistolet à Eau",
        `Capacité choisie : ${MOVE_NAMES[this.selectedMove]}`,
        `Niveau ${this.level()}   XP ${xpIntoLevel}/${XP_PER_LEVEL}   Créatures : ${this.placedCreatures.length}`,
        requestLine,
      ].join("\n"),
    );
  }

  private showToast(message: string): void {
    this.toastText.setText(message);
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setAlpha(1);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1800, duration: 600 });
  }

  // --- Helpers ----------------------------------------------------------

  private inBounds(r: number, c: number): boolean {
    return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS;
  }

  private textureForTile(tile: Tile, r: number, c: number): string {
    const alt = (r + c) % 2 === 0;
    switch (tile) {
      case Tile.Wasteland:
        return alt ? TEX.wastelandA : TEX.wastelandB;
      case Tile.Water:
        return alt ? TEX.waterA : TEX.waterB;
      case Tile.Grass:
      case Tile.Tree:
        return alt ? TEX.grassA : TEX.grassB;
    }
  }
}
