<p align="center">
  <img src="public/favicon.svg" width="72" height="72" alt="Visual Thinker logo">
</p>

<h1 align="center">Visual Thinker</h1>

<p align="center">
  A spacious canvas for capturing ideas, finding connections, and thinking in the open.
</p>

<p align="center">
  <a href="https://visual-thinker.pages.dev/"><strong>Open Visual Thinker</strong></a>
  ·
  <a href="https://github.com/PlaygrndLabs/visual-thinker/issues">Share feedback</a>
</p>

<p align="center">
  <img src="public/readme-hero.svg" width="100%" alt="A Visual Thinker canvas with connected ideas">
</p>

Visual Thinker is an immediate, full-screen workspace for ideas that are easier to understand spatially. Put down a thought, connect it to another, move things around, and let the shape of the canvas help you discover what comes next.

There are no files to organize or modes to learn. The interface stays quiet, your work saves in the browser, and the canvas gets out of the way.

## Think in space

- **Capture without ceremony.** Double-click anywhere to create an idea and start typing.
- **Make relationships visible.** Drag between ideas to connect them; connections reroute as the canvas changes.
- **Rearrange freely.** Move one thought or an entire selection until the structure makes sense.
- **Stay in flow.** Copy, paste, cut, undo, redo, zoom, and pan with familiar desktop gestures.
- **Return where you left off.** Ideas and viewport state persist locally in your browser.

## Essential gestures

| Intent | Mouse or trackpad | Keyboard |
| --- | --- | --- |
| Add an idea | Double-click empty canvas | `N` |
| Edit an idea | Double-click an idea | `Enter` finishes editing |
| Connect ideas | Drag from an idea edge into another idea | — |
| Select ideas | Click or drag a selection rectangle | `Shift`-click to add; `⌘/Ctrl+A` for all |
| Move around | Trackpad, middle-drag, or `Space`-drag | Hold `Space` while dragging |
| Zoom | Mouse wheel or `⌘/Ctrl` + scroll | Use the corner controls |
| Remove | Double-click a connection | `Backspace` / `Delete` for a selection |
| Undo / redo | — | `⌘/Ctrl+Z` / `⌘/Ctrl+Shift+Z` |

Right-click an idea, connection, or empty canvas for actions that fit the current selection.

## Run it locally

Visual Thinker uses [Bun](https://bun.sh/) for dependencies and scripts.

```bash
git clone https://github.com/PlaygrndLabs/visual-thinker.git
cd visual-thinker
make setup
make dev
```

Vite will print the local URL. To prefer a particular port:

```bash
PORT=4317 make dev
```

## Build

```bash
bun run lint
bun run build
```

The production bundle is written to `dist/`.

## Under the canvas

Visual Thinker is built with React 19, React Flow, Tailwind CSS 4, shadcn, Zod, and Vite. Canvas content, interaction familiarity, and viewport state are schema-validated before being stored in browser `localStorage`.

Every push to `main` is deployed automatically to [Cloudflare Pages](https://visual-thinker.pages.dev/). Other branches and pull requests receive preview deployments.

## Contributing

Ideas, bug reports, and focused pull requests are welcome. Start with an [issue](https://github.com/PlaygrndLabs/visual-thinker/issues) when a change would benefit from a little design discussion first.
