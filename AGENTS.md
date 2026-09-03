Visual Thinker is a visual playground for thinking, reasoning, and pure thinking-based discovery. Build it as an immediate, spacious working surface where ideas can be created, connected, rearranged, and explored with minimal friction.

.md files that AI writes & reads are plain-text context for AI, not documents that need one fixed format. Use XML for semantic structure and Markdown for content within that structure. Keep meaningful containers; avoid unnecessary leaf tags. Plain text can remain wherever neither adds clarity.

- `SPECS.md` is the durable definition of what the project has to be and do. Collect every user prompt that counts as spec there.
- A spec cannot stay verbatim when the prompt is a directive or request to change something. Convert it to spec-definition language, but keep the user's wording, don't paraphrase too much, and stay faithful to what they typed.
- Use the same wording fidelity for instructions the user asks to add to `AGENTS.md`.
- No TDD is needed to define the details of what has to be and what does not have to be. Tests are not cheap, and too many tests are a burden. Tests should be curated and arranged with the user. So far, this project does not need any tests.
- Use Bun for dependency management and project scripts.
- Do not create worktrees or work in branches. Work only on `main` in the current checkout.
- Keep the primary experience focused on the full-screen visual thinking canvas.
- Prefer direct manipulation, fast keyboard and mouse interactions, and quiet interface chrome.
- Make one commit per feature or distinct setup step.
- In each commit body, include a chronological bullet list of all relevant user prompts or excerpts. Keep them faithful, allowing up to ~10% editing to remove non-constructive wording or redundancies and to resolve references using wording from earlier prompts, so the entries connect and remain self-contained. Omit unrelated and automatically supplied context.
- Do not combine unrelated features in one commit.
- Keep commits in a working, buildable state whenever practical.
