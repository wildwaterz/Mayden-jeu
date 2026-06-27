# Mayden-jeu

A cozy, family-friendly game inspired by **Pokémon Pokopia**: play as a
shapeshifter and restore a withered world by **terraforming** the land —
grow grass and plant trees to build **habitats** that **attract wild
creatures**.

This repository is a starting point that a parent + kid (and AI agents) can
grow together. It ships with a tiny but real slice of the core gameplay loop so
there's always something runnable to build on.

## Tech stack

- [Vite](https://vitejs.dev/) — dev server + bundler
- [TypeScript](https://www.typescriptlang.org/)
- [Phaser 3](https://phaser.io/) — 2D game framework

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## How to play (current slice)

In-game text is in **French** (`français`). Controls:

- Move the shapeshifter with the **arrow keys** or **WASD**.
- Switch ability: **[1]** Feuillage (grow grass), **[2]** Arbre (plant a tree),
  **[3]** Pistolet à Eau (turn grass into water).
- Press **SPACE** to use the selected ability on the tile you're standing on.
- Press **R** to reset the world.

Build **habitats** to attract creatures and complete **requests** (`requêtes`)
for XP and levels (`niveaux`). Current habitats (see `src/habitats.ts`):

- **Forêt ombragée** — a tree with 4 grass neighbors → attracts Chenipan.
- **Étang paisible** — a water tile with ≥2 grass neighbors → attracts Carapuce.
- **Clairière ensoleillée** — a grass tile with ≥3 tree neighbors → attracts Pikachu.

Your progress is **saved automatically** in the browser (`localStorage`).

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the dev server (hot reload)     |
| `npm run build`   | Type-check and build for production   |
| `npm run preview` | Preview the production build          |
| `npm run lint`    | Lint the codebase with ESLint         |
| `npm run typecheck` | Type-check without emitting output  |

## Project structure

```
index.html              # Page shell that mounts the game
src/main.ts             # Phaser game bootstrap (pixel-art render config)
src/constants.ts        # Grid size, tile types, texture keys, palette
src/pixelArt.ts         # Builds textures from code-defined pixel grids
src/sprites.ts          # Pixel-art sprite grids (edit these to change art!)
src/scenes/GameScene.ts # Core terraform → habitat → creature loop
```

## Art style

The game uses a **2D pixel-art** style. All art is defined in code as small
character grids in `src/sprites.ts` (with the palette at the top of that file)
and terrain tiles are generated procedurally in `src/pixelArt.ts`. There are no
binary image assets, so sprites are easy to tweak by hand or with AI agents —
change a row of characters and the texture updates on reload.
