import Phaser from "phaser";
import {
  GRID_COLS,
  GRID_ROWS,
  HUD_TEXT_COLOR,
  PIXEL_SCALE,
  TERRAIN,
  TEX,
  TILE_SIZE,
  Tile,
} from "../constants";
import { drawSpriteTexture, drawTerrainTile } from "../pixelArt";
import { CREATURE_ART, PALETTE, PLAYER_ART, TREE_ART } from "../sprites";

type Move = "leafage" | "plant";

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Core gameplay slice inspired by Pokémon Pokopia:
 * the player terraforms a withered world (grow grass, plant trees) to build a
 * "tree-shaded grass" habitat, which attracts a wild creature.
 */
export class GameScene extends Phaser.Scene {
  private tiles: Tile[][] = [];
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private treeSprites = new Map<string, Phaser.GameObjects.Image>();
  private satisfiedHabitats = new Set<string>();

  private player!: Phaser.GameObjects.Image;
  private playerCol = Math.floor(GRID_COLS / 2);
  private playerRow = Math.floor(GRID_ROWS / 2);

  private selectedMove: Move = "leafage";
  private creaturesAttracted = 0;

  private hudText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.buildTextures();

    for (let r = 0; r < GRID_ROWS; r++) {
      this.tiles[r] = [];
      this.tileImages[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        this.tiles[r][c] = Tile.Wasteland;
        const image = this.add
          .image(c * TILE_SIZE, r * TILE_SIZE, this.textureForTile(Tile.Wasteland, r, c))
          .setOrigin(0, 0);
        this.tileImages[r][c] = image;
      }
    }

    this.player = this.add.image(0, 0, TEX.player).setDepth(50);
    this.positionPlayer();

    this.hudText = this.add
      .text(8, 8, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: HUD_TEXT_COLOR,
        backgroundColor: "rgba(0,0,0,0.45)",
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.toastText = this.add
      .text(GRID_COLS * TILE_SIZE * 0.5, 12, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#fff4b0",
        backgroundColor: "rgba(0,0,0,0.55)",
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5, 0)
      .setDepth(100)
      .setAlpha(0);

    this.registerInput();
    this.refreshHud();
  }

  private buildTextures(): void {
    drawTerrainTile(
      this,
      TEX.wastelandA,
      TERRAIN.wasteland.base,
      TERRAIN.wasteland.dark,
      TERRAIN.wasteland.light,
      PIXEL_SCALE,
      1337,
    );
    drawTerrainTile(
      this,
      TEX.wastelandB,
      TERRAIN.wasteland.base,
      TERRAIN.wasteland.dark,
      TERRAIN.wasteland.light,
      PIXEL_SCALE,
      4242,
    );
    drawTerrainTile(
      this,
      TEX.grassA,
      TERRAIN.grass.base,
      TERRAIN.grass.dark,
      TERRAIN.grass.light,
      PIXEL_SCALE,
      7,
    );
    drawTerrainTile(
      this,
      TEX.grassB,
      TERRAIN.grass.base,
      TERRAIN.grass.dark,
      TERRAIN.grass.light,
      PIXEL_SCALE,
      99,
    );
    drawSpriteTexture(this, TEX.tree, TREE_ART, PALETTE, PIXEL_SCALE);
    drawSpriteTexture(this, TEX.player, PLAYER_ART, PALETTE, PIXEL_SCALE);
    drawSpriteTexture(this, TEX.creature, CREATURE_ART, PALETTE, PIXEL_SCALE);
  }

  private positionPlayer(): void {
    this.player.setPosition(
      this.playerCol * TILE_SIZE + TILE_SIZE / 2,
      this.playerRow * TILE_SIZE + TILE_SIZE / 2,
    );
  }

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

    kb.on("keydown-SPACE", () => this.useMove());
  }

  private movePlayer(dr: number, dc: number): void {
    this.playerRow = Phaser.Math.Clamp(this.playerRow + dr, 0, GRID_ROWS - 1);
    this.playerCol = Phaser.Math.Clamp(this.playerCol + dc, 0, GRID_COLS - 1);
    this.positionPlayer();
  }

  private selectMove(move: Move): void {
    this.selectedMove = move;
    this.refreshHud();
  }

  private useMove(): void {
    const r = this.playerRow;
    const c = this.playerCol;
    const current = this.tiles[r][c];

    if (this.selectedMove === "leafage") {
      if (current === Tile.Wasteland) {
        this.setTile(r, c, Tile.Grass);
        this.checkHabitatsNear(r, c);
      } else {
        this.showToast("Leafage only works on bare wasteland.");
      }
      return;
    }

    if (current === Tile.Grass) {
      this.setTile(r, c, Tile.Tree);
      this.checkHabitatsNear(r, c);
    } else if (current === Tile.Tree) {
      this.showToast("A tree already grows here.");
    } else {
      this.showToast("Grow grass with Leafage before planting a tree.");
    }
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

  private checkHabitatsNear(r: number, c: number): void {
    // A change at (r,c) can complete a habitat centered on (r,c) if it is a
    // tree, or on any neighboring tree if (r,c) became grass.
    const candidates: Array<[number, number]> = [
      [r, c],
      ...NEIGHBORS.map(([dr, dc]) => [r + dr, c + dc] as [number, number]),
    ];
    for (const [tr, tc] of candidates) {
      if (!this.inBounds(tr, tc)) continue;
      if (this.tiles[tr][tc] !== Tile.Tree) continue;
      if (this.isTreeShadedGrassHabitat(tr, tc)) {
        const key = `${tr},${tc}`;
        if (!this.satisfiedHabitats.has(key)) {
          this.satisfiedHabitats.add(key);
          this.onHabitatBuilt(tr, tc);
        }
      }
    }
  }

  private isTreeShadedGrassHabitat(r: number, c: number): boolean {
    for (const [dr, dc] of NEIGHBORS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!this.inBounds(nr, nc)) return false;
      if (this.tiles[nr][nc] !== Tile.Grass) return false;
    }
    return true;
  }

  private onHabitatBuilt(r: number, c: number): void {
    this.creaturesAttracted += 1;
    this.spawnCreature(r, c);
    this.showToast("Habitat built! A wild creature was attracted!");
    this.refreshHud();
  }

  private spawnCreature(r: number, c: number): void {
    const cx = c * TILE_SIZE + TILE_SIZE / 2;
    const cy = r * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE * 0.55;
    const creature = this.add.image(cx, cy - 14, TEX.creature).setDepth(40).setAlpha(0);

    this.tweens.add({
      targets: creature,
      y: cy,
      alpha: 1,
      duration: 450,
      ease: "Back.Out",
    });
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

  private showToast(message: string): void {
    this.toastText.setText(message);
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setAlpha(1);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 1600,
      duration: 600,
    });
  }

  private refreshHud(): void {
    const moveLabel =
      this.selectedMove === "leafage" ? "Leafage (grow grass)" : "Plant Tree";
    this.hudText.setText(
      [
        "Move: arrows / WASD   Use: SPACE",
        "Switch move: [1] Leafage  [2] Plant Tree",
        `Selected: ${moveLabel}`,
        `Creatures attracted: ${this.creaturesAttracted}`,
      ].join("\n"),
    );
  }

  private inBounds(r: number, c: number): boolean {
    return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS;
  }

  private textureForTile(tile: Tile, r: number, c: number): string {
    const alt = (r + c) % 2 === 0;
    switch (tile) {
      case Tile.Wasteland:
        return alt ? TEX.wastelandA : TEX.wastelandB;
      case Tile.Grass:
      case Tile.Tree:
        return alt ? TEX.grassA : TEX.grassB;
    }
  }
}
