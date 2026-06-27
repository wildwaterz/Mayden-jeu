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

- Move the shapeshifter with the **arrow keys** or **WASD**.
- Switch moves: **[1]** Leafage (grow grass), **[2]** Plant Tree.
- Press **SPACE** to use the selected move on the tile you're standing on.
- Grow grass on the 4 tiles around a tree to build a **Tree-Shaded Grass
  habitat** — a wild creature will be attracted!

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
src/main.ts             # Phaser game bootstrap
src/constants.ts        # Grid size, tile types, palette
src/scenes/GameScene.ts # Core terraform → habitat → creature loop
```
