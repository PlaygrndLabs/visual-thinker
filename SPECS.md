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
- The project is configured for deployment to Cloudflare Pages with Wrangler using the PlaygrndLabs Cloudflare account.
- Every push to `main` builds that pushed revision with Bun and deploys it to `https://visual-thinker.pages.dev/` with Wrangler through GitHub Actions, providing the push-to-deploy behavior of a repository-connected Cloudflare Pages project.
</area>

<area name="Basic brainstorm diagramming">
- The canvas has interactive mouse- and keyboard-based basic brainstorm diagramming tools.
- Clicking the canvas creates an editable idea node at the clicked position and focuses it for immediate typing.
- Nodes can be easily connected by dragging their handles.
- The mouse wheel zooms the canvas in and out.
- Space + drag or middle-click + drag pans the canvas.
</area>

<area name="Canvas">
- React Flow attribution is not shown.

<area name="Logo">
- A floating “Visual Thinker” label gives the app its own unique identity with minimal branding; it sits at the top left in a narrow, chic/classy serif font.
- The logotype uses open, airy letter spacing rather than tight tracking.
- The logotype is implemented as a dedicated component.
</area>

<area name="Controls">
- Compact Google Maps-style controls at the bottom right provide zoom-in, zoom-out, and fit-all actions. Zoom-in and zoom-out form a joined vertical group; fit-all is a standalone control above them.
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
