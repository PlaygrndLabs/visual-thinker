Visual Thinker is a visual playground for thinking, reasoning, and pure thinking-based discovery. Build it as an immediate, spacious working surface where ideas can be created, connected, rearranged, and explored with minimal friction.

.md files that AI writes & reads are plain-text context for AI, not documents that need one fixed format. Use XML for semantic structure and Markdown for content within that structure. Keep meaningful containers; avoid unnecessary leaf tags. Plain text can remain wherever neither adds clarity.

- `SPECS.md` is the durable definition of what the project has to be and do. Collect every user prompt that counts as spec there.
- In `SPECS.md`, nest each area inside the area that contains it.
- A spec cannot stay verbatim when the prompt is a directive or request to change something. Convert it to spec-definition language, but keep the user's wording, don't paraphrase too much, and stay faithful to what they typed.
- Specs must be stateless and absolute: each spec must define the intended target independently of the implementation's current or previous state and must remain meaningful and correct as the implementation changes.
- Do not preserve relative statements such as “the current size is right,” “keep it as is,” or “it remains unchanged” as specs. Convert them to an explicit absolute requirement only when the intended requirement is known; otherwise remove or omit them until it is clarified.
- When adding or changing specs, audit related existing specs for state-dependent or ambiguous wording and remove any whose correct absolute requirement is uncertain.
- Use the same wording fidelity for instructions the user asks to add to `AGENTS.md`.
- No TDD is needed to define the details of what has to be and what does not have to be. Tests are not cheap, and too many tests are a burden. Tests should be curated and arranged with the user. So far, this project does not need any tests.
- Use Bun for dependency management and project scripts.
- Avoid CSS; use Tailwind classes.
- This project overrides the machine-wide default that agents do not run project servers. Adhere to this project's workflow requirements instead.
- For each new chat session that includes tasks, create and use a new worktree dedicated to that session so it does not conflict with other AI chat sessions working in their own worktrees.
- Open an internal terminal in the ChatGPT app in that session's worktree directory so the user can see it, and run `make dev` there on a dedicated localhost port that does not conflict with the servers used by other AI chat sessions.
- Open an internal ChatGPT browser to the localhost port dedicated to that session so the user can visually see and verify its features as they are added.
- For verifying visual changes or testing interactivity, prefer tools that see and control the same internal ChatGPT browser opened for the user over Playwright or any other method.
- After every commit, merge it into `main` as well, then push `main`.
- Keep the primary experience focused on the full-screen visual thinking canvas.
- Prefer direct manipulation, fast keyboard and mouse interactions, and quiet interface chrome.
- Make one commit per feature or distinct setup step.
- In each commit body, include a chronological bullet list of all relevant user prompts or excerpts. Keep them faithful, allowing up to ~10% editing to remove non-constructive wording or redundancies and to resolve references using wording from earlier prompts, so the entries connect and remain self-contained. Omit unrelated and automatically supplied context.
- Do not combine unrelated features in one commit.
- Keep commits in a working, buildable state whenever practical.
