# AGENTS.md

## Project overview

Mayden-jeu is a cozy, family-friendly 2D game inspired by **Pokémon Pokopia**.
The player terraforms a withered world (grow grass, plant trees) to build
habitats that attract wild creatures. It is built with **Vite + TypeScript +
Phaser 3** and runs in the browser.

The core gameplay loop lives in `src/scenes/GameScene.ts`. Tile types, grid
size, and the color palette are in `src/constants.ts`. The game is bootstrapped
in `src/main.ts` and mounted into `#game` in `index.html`.

## Common commands

See `README.md` and the `scripts` block in `package.json`. In short:
`npm run dev` (dev server), `npm run build` (typecheck + production build),
`npm run lint`, `npm run typecheck`.

## Cursor Cloud specific instructions

- This is a single frontend service. There is no backend, database, or external
  service to run — `npm run dev` (Vite) is the only process needed to develop
  and test end-to-end.
- The Vite dev server is configured with `host: true` on port `5173`
  (`vite.config.ts`), so it is reachable inside the VM at
  `http://localhost:5173/`.
- The production `npm run build` prints a "chunks larger than 500 kB" warning —
  this is just Phaser's bundle size, not an error, and the build still succeeds.
- The game only responds to keyboard input (arrows/WASD to move, `1`/`2` to
  switch move, `SPACE` to act) and the canvas must be focused/clicked first when
  testing via a browser before key presses register.
