import Phaser from "phaser";
import {
  DAY_NIGHT_MS,
  GRID_COLS,
  GRID_PIXEL_HEIGHT,
  GRID_PIXEL_WIDTH,
  GRID_ROWS,
  HUD_TEXT_COLOR,
  PIXEL_SCALE,
  SAVE_KEY,
  TERRAIN,
  TEX,
  TILE_SIZE,
  Tile,
  UI_BAR_HEIGHT,
  XP_PER_HABITAT,
  XP_PER_LEVEL,
  XP_PER_REQUEST,
  XP_PER_WISH,
} from "../constants";
import { drawSpriteTexture, drawTerrainTile } from "../pixelArt";
import { CREATURE_ART, CREATURE_SPRITES, PALETTE, PLAYER_ART, TREE_ART } from "../sprites";
import {
  creatureTextureKey,
  describeHabitat,
  HABITATS,
  TILE_WISH_FR,
  type HabitatDef,
} from "../habitats";
import { playAttract, playRequestComplete, unlockAudio } from "../audio";

type Move = "leafage" | "plant" | "water" | "fleurs";

interface PlacedCreature {
  id: string;
  r: number;
  c: number;
}

interface CreatureSprite {
  sprite: Phaser.GameObjects.Image;
  def: HabitatDef;
  homeX: number;
  homeY: number;
  homeR: number;
  homeC: number;
  request: Tile | null;
  marker: Phaser.GameObjects.Text | null;
}

const SURROUND: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

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
  fleurs: "Fleurs (fait pousser des fleurs)",
};

const ABILITY_BUTTONS: ReadonlyArray<{ move: Move; label: string }> = [
  { move: "leafage", label: "Feuillage" },
  { move: "plant", label: "Arbre" },
  { move: "water", label: "Eau" },
  { move: "fleurs", label: "Fleurs" },
];

/**
 * Core gameplay loop inspired by Pokémon Pokopia (texte en français) :
 * on terraforme un monde fané (herbe, arbres, eau) pour bâtir des habitats
 * qui attirent des créatures. Des requêtes guident le joueur et donnent de
 * l'XP pour monter de niveau. La partie est sauvegardée automatiquement.
 * Jouable au clavier OU à la souris/tactile (tap sur une case + boutons).
 */
export class GameScene extends Phaser.Scene {
  private tiles: Tile[][] = [];
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private treeSprites = new Map<string, Phaser.GameObjects.Image>();
  private placedCreatures: PlacedCreature[] = [];
  private creatureSprites: CreatureSprite[] = [];
  private satisfiedHabitats = new Set<string>();

  private player!: Phaser.GameObjects.Image;
  private playerCol = Math.floor(GRID_COLS / 2);
  private playerRow = Math.floor(GRID_ROWS / 2);

  private selectedMove: Move = "leafage";
  private xp = 0;
  private requestIndex = 0;

  private hudText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private taskText!: Phaser.GameObjects.Text;
  private abilityButtons = new Map<Move, Phaser.GameObjects.Rectangle>();
  private dexContainer!: Phaser.GameObjects.Container;
  private dexOpen = false;

  constructor() {
    super("GameScene");
  }

  /**
   * Phaser reuses the same Scene instance across `scene.restart()`, so class
   * fields are NOT re-initialized automatically. Reset all mutable state here
   * (init runs before create on every start AND restart) to avoid leftover
   * tiles/creatures from a previous session.
   */
  init(): void {
    this.tiles = [];
    this.tileImages = [];
    this.treeSprites = new Map();
    this.placedCreatures = [];
    this.creatureSprites = [];
    this.satisfiedHabitats = new Set();
    this.playerCol = Math.floor(GRID_COLS / 2);
    this.playerRow = Math.floor(GRID_ROWS / 2);
    this.selectedMove = "leafage";
    this.xp = 0;
    this.requestIndex = 0;
    this.abilityButtons = new Map();
    this.dexOpen = false;
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

    this.createDayNight();
    this.createControlBar();
    this.createHud();
    this.createDexPanel();

    this.registerInput();
    this.startCreatureLife();
    this.refreshHud();
    this.refreshTasks();
  }

  update(): void {
    // Keep each creature's request marker hovering above it as it wanders.
    for (const cs of this.creatureSprites) {
      if (cs.marker) {
        cs.marker.setPosition(cs.sprite.x, cs.sprite.y - TILE_SIZE * 0.5);
      }
    }
  }

  /** A looping ambient tint that cycles the world from day to night. */
  private createDayNight(): void {
    const overlay = this.add
      .rectangle(0, 0, GRID_PIXEL_WIDTH, GRID_PIXEL_HEIGHT, 0x0a1233)
      .setOrigin(0, 0)
      .setDepth(65)
      .setAlpha(0);
    // Tween the standard GameObject alpha (reliable) between day and night.
    this.tweens.add({
      targets: overlay,
      alpha: 0.6,
      duration: DAY_NIGHT_MS / 2,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  // --- Textures ---------------------------------------------------------

  private buildTextures(): void {
    drawTerrainTile(this, TEX.wastelandA, TERRAIN.wasteland.base, TERRAIN.wasteland.dark, TERRAIN.wasteland.light, PIXEL_SCALE, 1337);
    drawTerrainTile(this, TEX.wastelandB, TERRAIN.wasteland.base, TERRAIN.wasteland.dark, TERRAIN.wasteland.light, PIXEL_SCALE, 4242);
    drawTerrainTile(this, TEX.grassA, TERRAIN.grass.base, TERRAIN.grass.dark, TERRAIN.grass.light, PIXEL_SCALE, 7);
    drawTerrainTile(this, TEX.grassB, TERRAIN.grass.base, TERRAIN.grass.dark, TERRAIN.grass.light, PIXEL_SCALE, 99);
    drawTerrainTile(this, TEX.waterA, TERRAIN.water.base, TERRAIN.water.dark, TERRAIN.water.light, PIXEL_SCALE, 21);
    drawTerrainTile(this, TEX.waterB, TERRAIN.water.base, TERRAIN.water.dark, TERRAIN.water.light, PIXEL_SCALE, 55);
    drawTerrainTile(this, TEX.flowerA, TERRAIN.flower.base, TERRAIN.flower.dark, TERRAIN.flower.light, PIXEL_SCALE, 314);
    drawTerrainTile(this, TEX.flowerB, TERRAIN.flower.base, TERRAIN.flower.dark, TERRAIN.flower.light, PIXEL_SCALE, 271);
    drawSpriteTexture(this, TEX.tree, TREE_ART, PALETTE, PIXEL_SCALE);
    drawSpriteTexture(this, TEX.player, PLAYER_ART, PALETTE, PIXEL_SCALE);

    for (const habitat of HABITATS) {
      const spec = CREATURE_SPRITES[habitat.id];
      if (spec) {
        drawSpriteTexture(this, creatureTextureKey(habitat.id), spec.art, spec.palette, PIXEL_SCALE);
      } else {
        // Fallback: recolor the generic creature for habitats without bespoke art.
        drawSpriteTexture(
          this,
          creatureTextureKey(habitat.id),
          CREATURE_ART,
          { ".": null, q: habitat.creatureBase, Q: habitat.creatureDark, e: 0x222831, m: 0x8a2f5e },
          PIXEL_SCALE,
        );
      }
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
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        image.on("pointerdown", () => this.tapTile(r, c));
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
    this.spawnCreatureSprite(def, placed.r, placed.c, false);
  }

  private positionPlayer(): void {
    this.player.setPosition(
      this.playerCol * TILE_SIZE + TILE_SIZE / 2,
      this.playerRow * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  // --- UI: control bar + HUD -------------------------------------------

  private createControlBar(): void {
    const top = GRID_PIXEL_HEIGHT;
    this.add
      .rectangle(0, top, GRID_PIXEL_WIDTH, UI_BAR_HEIGHT, 0x1b2230)
      .setOrigin(0, 0)
      .setDepth(80);

    const buttons = [
      ...ABILITY_BUTTONS.map((b) => ({ label: b.label, move: b.move, action: () => this.selectMove(b.move) })),
      { label: "Créatures", move: null, action: () => this.toggleDex() },
      { label: "Rejouer", move: null, action: () => this.resetGame() },
    ];

    const pad = 8;
    const gap = 6;
    const count = buttons.length;
    const width = (GRID_PIXEL_WIDTH - pad * 2 - gap * (count - 1)) / count;
    const height = UI_BAR_HEIGHT - 16;
    const y = top + 8;

    buttons.forEach((btn, i) => {
      const x = pad + i * (width + gap);
      const rect = this.add
        .rectangle(x, y, width, height, 0x2b3650)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x44557a)
        .setDepth(81)
        .setInteractive({ useHandCursor: true });
      rect.on("pointerdown", btn.action);
      this.add
        .text(x + width / 2, y + height / 2, btn.label, {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#e8eef5",
        })
        .setOrigin(0.5)
        .setDepth(82);
      if (btn.move) this.abilityButtons.set(btn.move, rect);
    });

    this.highlightAbility();
  }

  private highlightAbility(): void {
    for (const [move, rect] of this.abilityButtons) {
      rect.setFillStyle(move === this.selectedMove ? 0x3f6f4a : 0x2b3650);
    }
  }

  private createHud(): void {
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
      .text(GRID_PIXEL_WIDTH * 0.5, 12, "", {
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

    // Bottom-right list of quests creatures are currently asking for
    // (kept clear of the top-left HUD and the top-center toast).
    this.taskText = this.add
      .text(GRID_PIXEL_WIDTH - 8, GRID_PIXEL_HEIGHT - 8, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#e8eef5",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: { x: 6, y: 4 },
        align: "right",
      })
      .setOrigin(1, 1)
      .setDepth(100);
  }

  private refreshTasks(): void {
    const lines: string[] = [];
    for (const cs of this.creatureSprites) {
      if (cs.request === null) continue;
      lines.push(`• ${cs.def.creatureName} veut ${TILE_WISH_FR[cs.request]} tout près`);
    }
    if (lines.length === 0) {
      this.taskText.setText("Tâches des créatures :\n(aucune pour l'instant)");
    } else {
      this.taskText.setText(["Tâches des créatures :", ...lines].join("\n"));
    }
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
    kb.on("keydown-FOUR", () => this.selectMove("fleurs"));

    kb.on("keydown-SPACE", () => this.useAbilityAt(this.playerRow, this.playerCol));
    kb.on("keydown-C", () => this.toggleDex());
    kb.on("keydown-R", () => this.resetGame());

    // Any key press is a user gesture; use it to unlock audio.
    kb.on("keydown", () => unlockAudio());
  }

  private movePlayer(dr: number, dc: number): void {
    if (this.dexOpen) return;
    this.playerRow = Phaser.Math.Clamp(this.playerRow + dr, 0, GRID_ROWS - 1);
    this.playerCol = Phaser.Math.Clamp(this.playerCol + dc, 0, GRID_COLS - 1);
    this.positionPlayer();
    this.saveGame();
  }

  /** Mouse/touch: hop to the tapped tile and apply the current ability. */
  private tapTile(r: number, c: number): void {
    unlockAudio();
    if (this.dexOpen) return;
    this.playerRow = r;
    this.playerCol = c;
    this.positionPlayer();
    this.saveGame();
    this.useAbilityAt(r, c);
  }

  private selectMove(move: Move): void {
    this.selectedMove = move;
    this.highlightAbility();
    this.refreshHud();
  }

  private useAbilityAt(r: number, c: number): void {
    if (this.dexOpen) return;
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
      case "fleurs":
        if (current === Tile.Grass) {
          this.applyTile(r, c, Tile.Flower);
        } else if (current === Tile.Flower) {
          this.showToast("Des fleurs poussent déjà ici.");
        } else {
          this.showToast("Fais pousser de l'herbe avant de semer des fleurs.");
        }
        break;
    }
  }

  private applyTile(r: number, c: number, tile: Tile): void {
    this.setTile(r, c, tile);
    this.checkHabitatsNear(r, c);
    this.checkRequests(r, c);
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
    this.spawnCreatureSprite(def, r, c, true);

    const request = this.currentRequest();
    if (request && request.id === def.id) {
      this.requestIndex += 1;
      this.addXp(XP_PER_HABITAT + XP_PER_REQUEST);
      playRequestComplete();
      this.showToast(
        `Requête accomplie ! ${def.creatureName} est attiré !\n+${XP_PER_HABITAT + XP_PER_REQUEST} XP`,
      );
    } else {
      this.addXp(XP_PER_HABITAT);
      playAttract();
      this.showToast(
        `Habitat « ${def.name} » créé !\n${def.creatureName} est attiré ! +${XP_PER_HABITAT} XP`,
      );
    }

    this.refreshHud();
    this.saveGame();
  }

  private spawnCreatureSprite(def: HabitatDef, r: number, c: number, animateIn: boolean): void {
    const homeX = c * TILE_SIZE + TILE_SIZE / 2;
    const homeY = r * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE * 0.55;
    const creature = this.add.image(homeX, homeY, creatureTextureKey(def.id)).setDepth(40);

    if (animateIn) {
      creature.setAlpha(0).setY(homeY - 14);
      this.tweens.add({ targets: creature, y: homeY, alpha: 1, duration: 450, ease: "Back.Out" });
    }

    this.creatureSprites.push({
      sprite: creature,
      def,
      homeX,
      homeY,
      homeR: r,
      homeC: c,
      request: null,
      marker: null,
    });
  }

  /** Periodic idle wandering + occasional happy hop for every creature. */
  private startCreatureLife(): void {
    const dx = Math.round(TILE_SIZE * 0.7);
    const dy = Math.round(TILE_SIZE * 0.4);
    this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        for (const cs of this.creatureSprites) {
          const { sprite, def, homeX, homeY } = cs;
          const tx = Phaser.Math.Clamp(
            homeX + Phaser.Math.Between(-dx, dx),
            TILE_SIZE * 0.3,
            GRID_PIXEL_WIDTH - TILE_SIZE * 0.3,
          );
          const ty = Phaser.Math.Clamp(
            homeY + Phaser.Math.Between(-dy, dy),
            TILE_SIZE * 0.2,
            GRID_PIXEL_HEIGHT - TILE_SIZE * 0.3,
          );
          sprite.setFlipX(tx < sprite.x);
          this.tweens.add({ targets: sprite, x: tx, y: ty, duration: 650, ease: "Sine.InOut" });

          if (Phaser.Math.Between(0, 2) === 0) {
            // Happy hop in place.
            this.tweens.add({
              targets: sprite,
              scaleX: 1.18,
              scaleY: 1.18,
              duration: 140,
              yoyo: true,
              ease: "Quad.Out",
            });
          }

          if (cs.request !== null) continue;

          const roll = Phaser.Math.Between(0, 4);
          if (roll === 0) {
            this.maybeStartRequest(cs);
          } else if (roll === 1 && def.wishes.length > 0) {
            const wish = def.wishes[Phaser.Math.Between(0, def.wishes.length - 1)];
            this.showWishBubble(sprite, wish);
          }
        }
      },
    });
  }

  /** A small French speech bubble above a creature expressing a wish. */
  private showWishBubble(sprite: Phaser.GameObjects.Image, text: string): void {
    const label = this.add
      .text(sprite.x, sprite.y - TILE_SIZE * 0.55, text, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#2a2030",
        backgroundColor: "#fff4d6",
        padding: { x: 5, y: 3 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(75);

    this.tweens.add({
      targets: label,
      y: label.y - 8,
      duration: 1800,
      ease: "Sine.Out",
      onComplete: () => label.destroy(),
    });
    this.tweens.add({ targets: label, alpha: 0, delay: 1200, duration: 600 });
  }

  /** Possibly have a creature ask the player to place a tile nearby. */
  private maybeStartRequest(cs: CreatureSprite): void {
    const desired = cs.def.requestTile;
    let hasDesired = false;
    let hasWorkable = false;
    for (const [dr, dc] of SURROUND) {
      const nr = cs.homeR + dr;
      const nc = cs.homeC + dc;
      if (!this.inBounds(nr, nc)) continue;
      const t = this.tiles[nr][nc];
      if (t === desired) hasDesired = true;
      if (t === Tile.Wasteland || t === Tile.Grass) hasWorkable = true;
    }
    // Only ask if it's a real, achievable task.
    if (hasDesired || !hasWorkable) return;

    cs.request = desired;
    cs.marker = this.add
      .text(cs.sprite.x, cs.sprite.y - TILE_SIZE * 0.5, "!", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffe14d",
        stroke: "#5a3d00",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(75);
    this.tweens.add({
      targets: cs.marker,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    this.showWishBubble(cs.sprite, cs.def.requestText);
    this.refreshTasks();
  }

  /** A tile changed at (r,c); fulfill any creature request it satisfies. */
  private checkRequests(r: number, c: number): void {
    for (const cs of this.creatureSprites) {
      if (cs.request === null) continue;
      const within =
        Math.abs(r - cs.homeR) <= 1 &&
        Math.abs(c - cs.homeC) <= 1 &&
        !(r === cs.homeR && c === cs.homeC);
      if (!within) continue;
      if (this.tiles[r][c] !== cs.request) continue;
      this.fulfillRequest(cs);
    }
  }

  private fulfillRequest(cs: CreatureSprite): void {
    cs.request = null;
    cs.marker?.destroy();
    cs.marker = null;
    this.addXp(XP_PER_WISH);
    playAttract();
    this.showWishBubble(cs.sprite, `${cs.def.thanksText} +${XP_PER_WISH} XP`);
    this.tweens.add({
      targets: cs.sprite,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 150,
      yoyo: true,
      ease: "Quad.Out",
    });
    this.refreshHud();
    this.refreshTasks();
    this.saveGame();
  }

  private habitatKey(def: HabitatDef, r: number, c: number): string {
    return `${def.id}:${r},${c}`;
  }

  // --- Dex panel --------------------------------------------------------

  private createDexPanel(): void {
    const bg = this.add
      .rectangle(0, 0, GRID_PIXEL_WIDTH, GRID_PIXEL_HEIGHT + UI_BAR_HEIGHT, 0x000000, 0.55)
      .setOrigin(0, 0)
      .setInteractive();
    bg.on("pointerdown", () => this.toggleDex());

    const panel = this.add
      .rectangle(GRID_PIXEL_WIDTH / 2, GRID_PIXEL_HEIGHT / 2, GRID_PIXEL_WIDTH - 80, GRID_PIXEL_HEIGHT - 80, 0x222b3d)
      .setStrokeStyle(3, 0x44557a);

    const title = this.add
      .text(GRID_PIXEL_WIDTH / 2, GRID_PIXEL_HEIGHT / 2 - (GRID_PIXEL_HEIGHT - 80) / 2 + 16, "Créatures attirées", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);

    this.dexContainer = this.add.container(0, 0, [bg, panel, title]).setDepth(200).setVisible(false);
  }

  private toggleDex(): void {
    this.dexOpen = !this.dexOpen;
    if (this.dexOpen) this.rebuildDexList();
    this.dexContainer.setVisible(this.dexOpen);
  }

  private rebuildDexList(): void {
    // Drop everything except the bg/panel/title (the first three children).
    const keep = this.dexContainer.list.slice(0, 3);
    for (const child of this.dexContainer.list.slice(3)) child.destroy();
    this.dexContainer.removeAll();
    keep.forEach((child) => this.dexContainer.add(child));

    const counts = new Map<string, number>();
    for (const placed of this.placedCreatures) {
      counts.set(placed.id, (counts.get(placed.id) ?? 0) + 1);
    }

    const left = GRID_PIXEL_WIDTH / 2 - (GRID_PIXEL_WIDTH - 80) / 2 + 28;
    let y = GRID_PIXEL_HEIGHT / 2 - (GRID_PIXEL_HEIGHT - 80) / 2 + 58;

    const discovered = HABITATS.filter((h) => (counts.get(h.id) ?? 0) > 0);
    if (discovered.length === 0) {
      const empty = this.add
        .text(GRID_PIXEL_WIDTH / 2, GRID_PIXEL_HEIGHT / 2, "Aucune créature pour l'instant.\nBâtis un habitat !", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#c8d2e0",
          align: "center",
        })
        .setOrigin(0.5);
      this.dexContainer.add(empty);
    } else {
      for (const def of discovered) {
        const icon = this.add.image(left, y, creatureTextureKey(def.id)).setOrigin(0.5, 0).setScale(0.8);
        const label = this.add
          .text(left + 36, y + 4, `${def.creatureName}  x${counts.get(def.id)}\n${def.name}`, {
            fontFamily: "monospace",
            fontSize: "13px",
            color: "#e8eef5",
          })
          .setOrigin(0, 0);
        this.dexContainer.add([icon, label]);
        y += 54;
      }
    }

    const hint = this.add
      .text(GRID_PIXEL_WIDTH / 2, GRID_PIXEL_HEIGHT / 2 + (GRID_PIXEL_HEIGHT - 80) / 2 - 16, "Touche « C » ou clique pour fermer", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9fb0c8",
      })
      .setOrigin(0.5, 1);
    this.dexContainer.add(hint);
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
    const xpIntoLevel = this.xp % XP_PER_LEVEL;

    const lines = [
      "Clique une case ou flèches/WASD + ESPACE",
      "Capacités : [1] Feuillage [2] Arbre [3] Eau [4] Fleurs",
      `Capacité choisie : ${MOVE_NAMES[this.selectedMove]}`,
      `Niveau ${this.level()}   XP ${xpIntoLevel}/${XP_PER_LEVEL}   Créatures : ${this.placedCreatures.length}`,
    ];
    if (request) {
      lines.push(`Requête : ${request.name} → attire ${request.creatureName}`);
      lines.push(`  Comment : ${describeHabitat(request)}`);
    } else {
      lines.push("Toutes les requêtes sont accomplies ! Bravo !");
    }

    this.hudText.setText(lines.join("\n"));
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
      case Tile.Flower:
        return alt ? TEX.flowerA : TEX.flowerB;
      case Tile.Grass:
      case Tile.Tree:
        return alt ? TEX.grassA : TEX.grassB;
    }
  }
}
