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
- The project uses Zod for runtime schema validation.
- `tips-and-experience-tracking.md` is the durable guide to experience evidence, contextual tip selection, known problems, decisions, and possible later solutions.
- Keyboard shortcut handling uses `@tanstack/react-hotkeys`.
- The `useLocalStorageState` hook requires a storage key, default value, and Zod schema; accepts stored JSON only when it satisfies that schema; falls back to its schema-validated default when stored data is missing, malformed, or invalid; saves only schema-valid state to browser localStorage; and returns the same state-and-setter tuple as React `useState`.
- Every state value persisted through `useLocalStorageState` has an explicitly defined Zod schema.
- The app page is a full-screen React Flow canvas.
- `make setup` installs the project's locked Bun dependencies with a frozen lockfile.
- `make dev` runs the project locally with Bun and automatically selects an available port when its preferred port is already in use.
- `make setup && make dev` is sufficient to prepare and run the project locally from a fresh worktree.
- Visual Thinker is deployed through a Cloudflare Pages project in the PlaygrndLabs Cloudflare account at `https://visual-thinker.pages.dev/`.
- The Cloudflare Pages project is connected natively to the `PlaygrndLabs/visual-thinker` GitHub repository.
- Cloudflare Pages builds every push to `main` for production and creates preview deployments for every other branch and pull request.
- The Cloudflare Pages build runs `bun install --frozen-lockfile` followed by `bun run build` from the repository root and publishes `dist`.
- Native Cloudflare Pages Git integration is the only deployment path; the repository contains no manual Cloudflare deployment tooling or configuration.
</area>

<area name="Basic brainstorm diagramming">
- The canvas has interactive mouse- and keyboard-based basic brainstorm diagramming tools.
- Idea nodes fit their text content and retain a small minimum width of 6rem.
- A new connection starts by dragging from a handle on a node edge, but its dragged end can be released anywhere inside another node without targeting a handle.
- While the dragged end of a new connection is inside a node, it snaps to the node edge nearest the source node according to automatic connection routing, independently of where the pointer entered or is released within the destination node.
- Connections have no input or output direction: the top, right, bottom, and left handles on every idea node have equal meaning and can each start or end a connection.
- Each pair of distinct idea nodes can have at most one connection, regardless of the handles or direction used to create it; duplicate connection attempts do not add overlapping lines.
- Each connection automatically uses the facing handle pair that best matches the current positions of its nodes and updates its handles whenever either connected node moves.
- Vertically separated nodes whose horizontal spans overlap connect bottom-to-top; horizontally separated nodes whose vertical spans overlap connect right-to-left, with each pair reversed when the node positions are reversed.
- Connections between nodes render as smooth curved lines without straight segments or elbows.
</area>

<area name="Canvas">
- React Flow attribution is not shown.

<area name="State and persistence">
- All contents of the canvas come from a single state variable.
- Canvas contents are stored in browser localStorage, saved after each change, and loaded on page load.
- Canvas-content persistence uses the `useLocalStorageState` hook.
- A single viewport state value holds the user's selected pan and zoom, the fitted pan and zoom, and which view is active; it persists in browser localStorage through `useLocalStorageState`.

<area name="Experience memory">
- The app remembers the user's familiarity with known experiencable actions so routine guidance can become simpler and disappear as the user demonstrates knowledge.
- Known experiences include scrolling to zoom, panning the canvas through middle-button drag or Space-drag, and creating a node through canvas double-click.
- All experience observations are handled by the `flagExperience` function returned from the custom `useExperiences` hook; the hook also returns every known experience's current level and stored evidence and a `maySuggestTip` function for contextual guidance.
- Each experience has one of four monotonic levels: `not-experienced-yet`, `tried-once`, `may-know-it`, or `knows-it`.
- Each experience stores its level, its last-used date/time timestamp, and bounded evidence of immediate practice and successful recall after a delay; it does not store individual use timestamps or an unbounded lifetime usage count.
- Experience v1 distinguishes immediate retrieval strength from durable storage strength: repeated uses within one practice bout build capped practice strength with diminishing returns, while successful unprompted reuse after a meaningful delay builds more durable retention strength.
- A practice bout ends after 30 minutes without using the experience. One, two, four, and eight uses within a bout establish practice-strength levels one through four; additional uses within that bout do not add practice evidence.
- An unprompted successful return after 30 minutes, 8 hours, 3 days, or 7 days contributes progressively stronger retention evidence. Prompted use builds practice evidence but is not treated as proof of unaided recall.
- `tried-once` represents initial successful use; `may-know-it` represents demonstrated immediate fluency or initial spaced recall; `knows-it` requires durable retention evidence, or maximum practice strength reinforced by delayed recall.
- Experience levels never automatically downgrade. The last-used timestamp remains available for a separate future staleness policy.
- The experience strategy version is part of its localStorage key. Experience v1 uses `visual-thinker.experiences.v1`; a future strategy uses a new key so older evidence remains available for analysis or explicit migration.
- Raw input events are collapsed into completed, effective interaction episodes before an experience is flagged: one wheel gesture that changes zoom, one middle-button or Space-drag that moves the viewport, or one successfully created double-click node.
- `maySuggestTip` accepts an ordered array of candidate tip keys, evaluates each tip's experience level and last-used timestamp in priority order, and returns the first eligible tip or the empty tip when none is eligible.
- A tip is not eligible when its action was used less than 60 seconds ago.
- A `not-experienced-yet` action is immediately eligible when proposed. A `tried-once` action is suppressed for the remainder of its local calendar day and becomes eligible on a later day because the first use may have been accidental. A `may-know-it` action becomes eligible after one week without use, and a `knows-it` action becomes eligible after one month without use.
- Tip eligibility policies can vary by experience type while preserving recency suppression and priority evaluation.
- Every action taught by an experience tip calls `maySuggestTip` after it is successfully performed, passing any next candidate tips in priority order or an empty array when there are no alternatives. When no candidate is eligible, the selected tip key becomes empty and the current tip disappears immediately.
</area>
</area>

<interactivity>
### Mouse

- Pressing the primary mouse button on empty canvas is provisional and does not itself create a node or perform another definitive action.
- Clicking empty canvas does not create a node. After enough time has passed to know the interaction is not a double-click, the status bar requests add-node guidance first and pan guidance second through `maySuggestTip`.
- Double-clicking empty canvas creates an editable idea node with empty text whose top-left corner is offset slightly to the right and below the pointer in screen space, focuses its text box for immediate typing, and clears the status-bar tip.
- When an idea node's text box loses focus with empty text, the node and its connections are deleted.
- A connection remains the pointer target while hovered, uses a hand cursor, and absorbs clicks and double-clicks without creating a node or altering the connection.
- Empty canvas space uses the normal arrow mouse cursor when Space is not held.
- Starting a primary-button drag cancels node creation and draws a selection rectangle.
- The selection rectangle has the translucent blue fill and crisp, solid blue outline associated with the Windows XP Explorer and desktop selection rectangle; its border is not dotted or dashed.
- Starting a selection-rectangle drag requests the pan tip through `maySuggestTip`.
- After a rectangle selection is completed, selected nodes keep their individual selected-state highlighting without a shared rectangle bounding the selection.
- A single clicked node is selected by itself and its text box receives focus for editing.
- When multiple nodes are selected, their text boxes do not have editing focus.
- A desktop wheel gesture that reports any nonzero horizontal delta is treated as trackpad-like input and pans the canvas in both directions for the rest of that gesture.
- A desktop wheel gesture that reports only vertical delta zooms the canvas in and out.
- Ctrl+scroll or Command+scroll zooms the canvas regardless of the wheel gesture's horizontal delta.
- Middle-button drag pans the canvas.

### Keyboard

- Holding Space while dragging pans the canvas.
- Holding Space without dragging shows the open-hand cursor.
- Dragging to pan while holding Space shows the closed-hand grabbing cursor.
- Releasing Space returns the cursor to whatever state the rest of the app dictates.
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

<area name="Favicon">
- Every favicon uses a low-detail, minimal brain-shaped mark made from a few broad curves, colored soft pink `#F4B5B8`, with a compact black serif “V” in bold strokes placed high within the brain and layered over it.
- The “V” has visible vertical bounds from `y=17` through `y=47` within the favicon's `64×64` SVG viewBox.
- The favicon is drawn as SVG and supplied exclusively as an SVG favicon, with no PNG favicon assets or references.
- The SVG favicon contains only the brain and “V” artwork on a transparent background.
</area>
</area>

<area name="Controls">
- Compact Google Maps-style controls at the bottom right provide zoom-in, zoom-out, and fit-all actions. Zoom-in and zoom-out form a joined vertical group; fit-all is a standalone control above them.
- Canvas floating controls use a dedicated `CanvasFloatingButton` component built on the shared shadcn `Button`, with a 6px outer corner radius.
- The standalone fit-all control uses the same neutral background, border, and icon colors as the grouped zoom controls, including when the fit-all action is unavailable.
- Viewport controls keep neutral coloring and remain visually stationary when pressed.
- The fit-all control toggles between fitting all canvas content into view and restoring the user’s previously chosen pan and zoom.
- Clicking zoom-in or zoom-out requests scroll-to-zoom guidance first and pan guidance second through `maySuggestTip`.
- Clicking fit-all or restore-view requests pan guidance first and scroll-to-zoom guidance second through `maySuggestTip`.
- Refreshing the page preserves the active side of the fit-all toggle and both of its views; the canvas, button state, and next toggle action continue as though the page had not refreshed.
- The bottom-right controls are offset upward by the height of one line of instruction text.
</area>

<area name="Context menu">
- Right-clicking the canvas opens a shadcn context menu.
- The context menu provides an always-available Clear action that removes every node and edge, restores the default pan and zoom, exits the fitted view, and makes the logo visible without clearing or changing experience tracks.
- The context menu provides a Full reset action that clears every localStorage value for the app's origin, including current and older experience tracks, and reloads the app into clean defaults.
</area>

<area name="Instructions">
- A dedicated `StatusBar` component displays the active canvas tip from a tip-key prop and owns the text associated with each tip key.
- The status bar cross-fades between tips with a CSS transition when its tip-key prop changes.
- The default status-bar tip is empty.
- Panning, scrolling to zoom, and double-clicking to add a node have separate tip keys and separate tip text.
- The pan tip teaches only Space-drag and middle-drag; it does not mention trackpad panning.
- Experience tips are muted small text without a box style, sit in the middle of the bottom edge, use the available horizontal space, and do not wrap onto another line.
- Contextual tip requests use `maySuggestTip`; the status bar shows only the highest-priority eligible candidate and remains empty when no candidate is eligible.
</area>
</area>
</specs>
