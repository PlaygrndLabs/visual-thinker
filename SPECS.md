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
- Keyboard shortcut handling uses `@tanstack/react-hotkeys`.
- The `useLocalStorageState` hook accepts a storage key and default value, loads JSON state from browser localStorage on page load, saves state changes back to localStorage, and returns the same state-and-setter tuple as React `useState`.
- The app page is a full-screen React Flow canvas.
- The project can run locally with `make dev`, which uses Bun.
- Visual Thinker is deployed through a Cloudflare Pages project in the PlaygrndLabs Cloudflare account at `https://visual-thinker.pages.dev/`.
- The Cloudflare Pages project is connected natively to the `PlaygrndLabs/visual-thinker` GitHub repository.
- Cloudflare Pages builds every push to `main` for production and creates preview deployments for every other branch and pull request.
- The Cloudflare Pages build runs `bun install --frozen-lockfile` followed by `bun run build` from the repository root and publishes `dist`.
- Native Cloudflare Pages Git integration is the only deployment path; the repository contains no manual Cloudflare deployment tooling or configuration.
</area>

<area name="Basic brainstorm diagramming">
- The canvas has interactive mouse- and keyboard-based basic brainstorm diagramming tools.
- Nodes can be easily connected by dragging their handles.
</area>

<area name="Canvas">
- React Flow attribution is not shown.

<area name="State and persistence">
- All contents of the canvas come from a single state variable.
- Canvas contents are stored in browser localStorage, saved after each change, and loaded on page load.
- Canvas-content persistence uses the `useLocalStorageState` hook.
- A single viewport state value holds the user's selected pan and zoom, the fitted pan and zoom, and which view is active; it persists in browser localStorage through `useLocalStorageState`.
</area>

<interactivity>
### Mouse

- Pressing the primary mouse button on empty canvas is provisional and does not itself create a node or perform another definitive action.
- Clicking empty canvas does not create a node. The status bar changes from its pan-and-zoom tip to a “Double click to add node” tip only after enough time has passed to know the interaction is not a double-click.
- Double-clicking empty canvas creates an editable idea node at the clicked position, focuses it for immediate typing, and returns the status bar to its default pan-and-zoom tip.
- Empty canvas space uses the normal arrow mouse cursor rather than a hand cursor.
- Starting a primary-button drag cancels node creation and draws a selection rectangle.
- The selection rectangle has the translucent blue fill and crisp, solid blue outline associated with the Windows XP Explorer and desktop selection rectangle; its border is not dotted or dashed.
- After a rectangle selection is completed, selected nodes keep their individual selected-state highlighting without a shared rectangle bounding the selection.
- A single clicked node is selected by itself and its text box receives focus for editing.
- When multiple nodes are selected, their text boxes do not have editing focus.
- The mouse wheel zooms the canvas in and out.
- Middle-button drag pans the canvas.

### Keyboard

- Holding Space while dragging pans the canvas.
- Holding Shift while clicking nodes adds them to the selection.
- Ctrl+A or Command+A selects all nodes on the canvas.
- Backspace or Delete removes selected nodes or edges.
- Canvas changes can be undone with Ctrl+Z or Command+Z.
- Canvas changes can be redone with Ctrl+Shift+Z, Ctrl+Y, Command+Shift+Z, or Command+Y.
- Selected canvas items can be copied with Ctrl+C or Command+C, pasted with Ctrl+V or Command+V, and cut with Ctrl+X or Command+X.
- Each paste action inserts exactly one copy of the clipboard contents.
- Copying nodes includes the connections between copied nodes; pasted items receive new identities, appear offset from their originals, and become the current selection.
- Pasting external single-line plain text creates one selected idea node near the center of the viewport.
- Pasting external multi-line plain text creates one selected idea node for each non-empty line and arranges those ideas in a vertical stack near the center of the viewport.
- Canvas clipboard shortcuts do not replace native text-editing clipboard behavior while an idea text field has focus.
- Creating, connecting, deleting, clearing, moving, and editing ideas are undoable canvas changes.
- Cutting and pasting canvas items are undoable canvas changes; copying them is not a canvas change.
- Each completed node drag and idea-text editing session is one undoable change rather than a sequence of intermediate changes.
- Selection, viewport movement, and transient focus behavior are not canvas history entries.
</interactivity>

<area name="Logo">
- A floating “Visual Thinker” label gives the app its own unique identity with minimal branding; it sits at the top left in Georgia Regular at font weight 400.
- The logotype prefers the device-installed Georgia face and falls back to Source Serif 4 Regular, loading its Latin glyphs from Google Fonts when the fallback is not installed on the device.
- The logotype uses the typeface's native spacing and proportions without letter-spacing, font-stretching, or other font-related Tailwind classes.
- The logo is implemented as a dedicated `Logo` component.
- Clicking the logo fades it out with a CSS opacity transition and then removes it from the canvas chrome.
</area>

<area name="Controls">
- Compact Google Maps-style controls at the bottom right provide zoom-in, zoom-out, and fit-all actions. Zoom-in and zoom-out form a joined vertical group; fit-all is a standalone control above them.
- Canvas floating controls use a dedicated `CanvasFloatingButton` component built on the shared shadcn `Button`, with a 6px outer corner radius.
- The standalone fit-all control uses the same neutral background, border, and icon colors as the grouped zoom controls, including when the fit-all action is unavailable.
- Viewport controls keep neutral coloring and remain visually stationary when pressed.
- The fit-all control toggles between fitting all canvas content into view and restoring the user’s previously chosen pan and zoom.
- Refreshing the page preserves the active side of the fit-all toggle and both of its views; the canvas, button state, and next toggle action continue as though the page had not refreshed.
- The bottom-right controls are offset upward by the height of one line of instruction text.
</area>

<area name="Context menu">
- Right-clicking the canvas opens a shadcn context menu.
- The context menu provides an always-available Clear action that fully resets the app state: it removes every node and edge, restores the default pan and zoom, exits the fitted view, and makes the logo visible.
</area>

<area name="Instructions">
- A dedicated `StatusBar` component displays the active canvas tip from a tip-key prop and owns the text associated with each tip key.
- The status bar cross-fades between tips with a CSS transition when its tip-key prop changes.
- The default “Space + drag or middle-drag to pan · Scroll to zoom” tip is muted small text without a box style, sits in the middle of the bottom edge, uses the available horizontal space, and does not wrap onto another line.
- The status bar can show a “Double click to add node” tip in place of its default pan-and-zoom tip.
</area>
</area>
</specs>
