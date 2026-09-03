<specs>
  <purpose>
    SPECS.md is the durable definition of what Visual Thinker has to be and do. It collects user prompts that count as project specs, expressed as definitions rather than directives or requests to change.
  </purpose>

  <area name="Visual Thinker">
    <requirement>Visual Thinker is a visual playground for thinking, reasoning, and pure thinking-based discovery.</requirement>
    <requirement>The experience is an immediate, spacious working surface where ideas can be created, connected, rearranged, and explored with minimal friction.</requirement>
    <requirement>The primary experience is a full-screen visual thinking canvas with quiet interface chrome.</requirement>
    <requirement>Direct manipulation and fast keyboard and mouse interactions are preferred.</requirement>
  </area>

  <area name="Foundation">
    <requirement>The project uses Bun.</requirement>
    <requirement>The project includes Storybook, shadcn, and React Flow.</requirement>
    <requirement>The app page is a full-screen React Flow canvas.</requirement>
    <requirement>The project can run locally with `make dev`, which uses Bun.</requirement>
    <requirement>The project is configured for deployment to Cloudflare Pages with Wrangler using the PlaygrndLabs Cloudflare account.</requirement>
  </area>

  <area name="Basic brainstorm diagramming">
    <requirement>The canvas has interactive mouse- and keyboard-based basic brainstorm diagramming tools.</requirement>
    <requirement>Clicking the canvas creates an editable idea node at the clicked position and focuses it for immediate typing.</requirement>
    <requirement>Nodes can be easily connected by dragging their handles.</requirement>
    <requirement>The mouse wheel zooms the canvas in and out.</requirement>
    <requirement>Space + drag or middle-click + drag pans the canvas.</requirement>
  </area>

  <area name="Canvas chrome">
    <requirement>The top-left “Visual Thinker / Click the canvas to capture a thought” panel and its add button are not shown.</requirement>
    <requirement>React Flow attribution is not shown.</requirement>
    <requirement>The “Space + drag or middle-drag to pan · Scroll to zoom” hint remains as muted small text without a box style.</requirement>
  </area>
</specs>
