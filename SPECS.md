<specs>
Purpose: SPECS.md is the durable definition of what Visual Thinker has to be and do. It collects user prompts that count as project specs, expressed as definitions rather than directives or requests to change.

# Visual Thinker

- Visual Thinker is a visual playground for thinking, reasoning, and pure thinking-based discovery.
- The experience is an immediate, spacious working surface where ideas can be created, connected, rearranged, and explored with minimal friction.
- The primary experience is a full-screen visual thinking canvas with quiet interface chrome.
- Direct manipulation and fast keyboard and mouse interactions are preferred.

## Foundation

- The project uses Bun.
- The project includes Storybook, shadcn, and React Flow.
- The app page is a full-screen React Flow canvas.
- The project can run locally with `make dev`, which uses Bun.
- The project is configured for deployment to Cloudflare Pages with Wrangler using the PlaygrndLabs Cloudflare account.

## Basic brainstorm diagramming

- The canvas has interactive mouse- and keyboard-based basic brainstorm diagramming tools.
- Clicking the canvas creates an editable idea node at the clicked position and focuses it for immediate typing.
- Nodes can be easily connected by dragging their handles.
- The mouse wheel zooms the canvas in and out.
- Space + drag or middle-click + drag pans the canvas.

## Canvas chrome

- The top-left “Visual Thinker / Click the canvas to capture a thought” panel and its add button are not shown.
- React Flow attribution is not shown.
- The “Space + drag or middle-drag to pan · Scroll to zoom” hint remains as muted small text without a box style.
</specs>
