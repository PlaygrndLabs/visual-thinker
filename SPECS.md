<specs>
<purpose>SPECS.md is the durable definition of what Visual Thinker has to be and do. It collects user prompts that count as project specs, expressed as definitions rather than directives or requests to change.</purpose>

<area name="Visual Thinker">
- Visual Thinker is a visual playground for thinking, reasoning, and pure thinking-based discovery.
- The experience is an immediate, spacious working surface where ideas can be created, connected, rearranged, and explored with minimal friction.
- The primary experience is a full-screen visual thinking canvas with quiet interface chrome.
- Direct manipulation and fast keyboard and mouse interactions are preferred.
</area>

<area name="Foundation">
- The project uses Bun.
- The project includes Storybook, shadcn, and React Flow.
- The app page is a full-screen React Flow canvas.
- The project can run locally with `make dev`, which uses Bun.
- Visual Thinker is deployed through a Cloudflare Pages project in the PlaygrndLabs Cloudflare account at `https://visual-thinker.pages.dev/`.
- The Cloudflare Pages project is connected natively to the `PlaygrndLabs/visual-thinker` GitHub repository.
- Cloudflare Pages builds every push to `main` for production and creates preview deployments for every other branch and pull request.
- The Cloudflare Pages build runs `bun install --frozen-lockfile` followed by `bun run build` from the repository root and publishes `dist`.
</area>

<area name="Basic brainstorm diagramming">
- The canvas has interactive mouse- and keyboard-based basic brainstorm diagramming tools.
- Nodes can be easily connected by dragging their handles.
</area>

<area name="Canvas">
- React Flow attribution is not shown.

<interactivity>
### Mouse

- Pressing the primary mouse button on empty canvas is provisional and does not itself create a node or perform another definitive action.
- Releasing the primary mouse button without dragging completes a click, creates an editable idea node at the clicked position, and focuses it for immediate typing.
- Starting a primary-button drag cancels node creation and draws a selection rectangle.
- The selection rectangle has the translucent blue fill and crisp, solid blue outline associated with the Windows XP Explorer and desktop selection rectangle; its border is not dotted or dashed.
- The mouse wheel zooms the canvas in and out.
- Middle-button drag pans the canvas.

### Keyboard

- Holding Space while dragging pans the canvas.
- Backspace or Delete removes selected nodes or edges.
</interactivity>

<area name="Logo">
- A floating “Visual Thinker” label gives the app its own unique identity with minimal branding; it sits at the top left in a narrow, chic/classy serif font.
- The logotype uses open, airy letter spacing rather than tight tracking.
- The logotype is implemented as a dedicated component.
</area>

<area name="Controls">
- Compact Google Maps-style controls at the bottom right provide zoom-in, zoom-out, and fit-all actions. Zoom-in and zoom-out form a joined vertical group; fit-all is a standalone control above them.
- Canvas floating controls use a dedicated `CanvasFloatingButton` component built on the shared shadcn `Button`, with a 6px outer corner radius.
- The standalone fit-all control uses the same neutral background, border, and icon colors as the grouped zoom controls, including when the fit-all action is unavailable.
- Viewport controls keep neutral coloring and remain visually stationary when pressed.
- The fit-all control toggles between fitting all canvas content into view and restoring the user’s previously chosen pan and zoom.
- The bottom-right controls are offset upward by the height of one line of instruction text.
</area>

<area name="Instructions">
- The “Space + drag or middle-drag to pan · Scroll to zoom” hint is muted small text without a box style, sits in the middle of the bottom edge, uses the available horizontal space, and does not wrap onto another line.
</area>
</area>
</specs>
