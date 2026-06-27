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

Two control schemes (great for desktop *and* tablet):

- **Keyboard**: move with **arrow keys** / **WASD**, switch ability with
  **[1]/[2]/[3]**, act with **SPACE**, toggle the creature panel with **C**,
  reset with **R**.
- **Mouse / touch**: **tap a tile** to hop there and apply the selected ability,
  and use the **on-screen bottom bar** (Feuillage, Arbre, Eau, Créatures,
  Rejouer).

Abilities: **Feuillage** (grow grass), **Arbre** (plant a tree),
**Pistolet à Eau** (turn grass into water), **Fleurs** (grow flowers on grass).

Attracted creatures wander and live in your world and play a sound when
attracted. They occasionally show a **wish bubble**; sometimes a creature makes
a **mini-request** (a "!" appears) asking you to place a specific tile next to
it — fulfill it for bonus XP. A gentle **day/night cycle** tints the world over
time. The **Créatures** panel shows everyone you've collected so far.

Build **habitats** to attract creatures and complete **requests** (`requêtes`)
for XP and levels (`niveaux`). Current habitats (see `src/habitats.ts`):

- **Forêt ombragée** — a tree with 4 grass neighbors → attracts Chenipan.
- **Étang paisible** — a water tile with ≥2 grass neighbors → attracts Carapuce.
- **Clairière ensoleillée** — a grass tile with ≥3 tree neighbors → attracts Pikachu.
- **Prairie fleurie** — a flower tile with ≥2 flower neighbors → attracts Papilusion.

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
