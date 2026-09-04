<guide name="Tips and experience tracking">
<purpose>

# Purpose

Visual Thinker should teach interactions without turning the canvas into a permanently instructional interface. Tips are contextual suggestions, not persistent chrome. Experience tracking supplies evidence about whether a person probably remembers an action, while recent successful use prevents the app from immediately re-teaching something the person just demonstrated.

This guide records the problems encountered, the decisions made so far, the current target behavior, and possible directions for later versions.

</purpose>

<principles>

# Product principles

- The status bar is empty by default.
- Tips appear only in response to a context that makes them useful.
- A tip disappears as soon as the user successfully performs an action taught by a tip.
- The app remembers experience across reloads so it can become quieter as the user learns.
- A single action can be accidental. It should suppress an immediate redundant reminder without being treated as durable mastery.
- Repeated use in one short burst demonstrates current fluency, not necessarily memory that will survive until tomorrow.
- Successful reuse after time has passed is stronger evidence of retention than sheer repetition in one practice session.
- More experienced users need a longer period without using an action before reminding them becomes appropriate.

</principles>

<known-experiences>

# Known experiences

The initial experiencable actions are:

| Experience | Successful observation | Tip |
|---|---|---|
| Scroll zoom | A completed wheel gesture changes the canvas zoom | `Scroll to zoom` |
| Canvas pan | A completed middle-button drag or Space-drag moves the viewport | `Space + drag or middle-drag to pan` |
| Double-click node creation | A canvas double-click successfully creates a node | `Double click to add node` |
| Double-click connection removal | A connection double-click successfully removes the connection | `Double click a connection to break it` |

Trackpad panning is supported canvas behavior, but it is not stated in the pan tip and does not count as learning the middle-button or Space-drag pan experience.

Raw browser events are grouped into meaningful completed episodes before they are recorded. A wheel burst is one zoom episode, a completed qualifying drag is one pan episode, one successful double-click creation is one add-node episode, and one connection successfully removed by double-click is one connection-removal episode.

</known-experiences>

<experience-api>

# `useExperiences`

All experience observations pass through `flagExperience` returned by the custom `useExperiences` hook. Callers do not write experience booleans directly.

The hook returns:

- `experiences`: every known experience and its complete stored evidence;
- `experienceLevels`: the current level of every known experience;
- `flagExperience(experience, options)`: records successful use, updates `lastUsedAt`, adds bounded learning evidence, and upgrades the level when justified;
- `maySuggestTip(candidates)`: evaluates ordered candidate tip keys and returns the first tip that is currently worth showing, or an empty selection when none should be shown.

Every action taught by a tip calls `maySuggestTip` after successful completion. It supplies any useful next tips in priority order or at least an empty candidate array, `maySuggestTip([])`, so the current selected tip is cleared when no alternative is appropriate.

</experience-api>

<storage>

# Storage and validation

Experience state is persisted through `useLocalStorageState`, whose Zod schema is required. Invalid JSON or state that does not satisfy its schema falls back to validated defaults, and only schema-valid state is stored.

The strategy version is part of the localStorage key. The current learning strategy is stored under:

```text
visual-thinker.experiences.v1
```

A future strategy should use a new key such as `visual-thinker.experiences.v2`. Keeping v1 data intact makes it possible to inspect older evidence or explicitly migrate it into the newer model.

Each v1 experience record contains:

```js
{
  expLevel,
  lastUsedAt,
  practiceStrength,
  currentBoutUseCount,
  retentionStrength,
  spacedReturnCount,
  longestSuccessfulGapMs,
}
```

Evidence counters are bounded. The app does not store every use timestamp or an unlimited lifetime count.

The context-menu `Clear` action resets the canvas, viewport, logo, and transient tip without changing experience tracks. In local Vite development only, `Full reset` clears every localStorage value for the origin, including every current or older experience version, and reloads the app into clean defaults. Production builds, including Cloudflare Pages production and preview deployments, do not render the action or register its keyboard shortcut.

</storage>

<learning-model version="v1">

# Experience levels and learning evidence

Each experience has one monotonic level:

| Level | Meaning |
|---|---|
| `not-experienced-yet` | No successful use has been observed |
| `tried-once` | Initial encoding or possibly accidental successful use |
| `may-know-it` | Immediate fluency or some spaced-recall evidence exists |
| `knows-it` | Durable retention evidence exists |

Levels do not automatically downgrade. Recency affects whether a reminder is useful; it does not rewrite the historical learning level.

V1 separates two kinds of evidence:

- **Practice strength:** massed use within one bout. A bout ends after 30 minutes without using the experience. One, two, four, and eight uses establish practice-strength levels one through four. More uses in the same bout add no further evidence.
- **Retention strength:** successful unprompted reuse after a delay. Returns after 30 minutes, 8 hours, 3 days, and 7 days add progressively stronger evidence. Prompted execution strengthens practice but is not proof of unaided recall.

This distinction is grounded in the difference between immediate retrieval strength and durable storage strength. Conditions that produce fast performance during practice do not necessarily produce long-term retention; distributed practice and successful retrieval after a delay provide stronger evidence. Relevant background includes [Bjork's desirable-difficulties framework](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/RBjork_inpress.pdf) and the [Cepeda et al. distributed-practice meta-analysis](https://pubmed.ncbi.nlm.nih.gov/16719566/).

</learning-model>

<tip-selection status="implemented">

# Recency-aware tip selection

## Problem with level-only selection

The first `maySuggestTip` policy considered only `expLevel`. This produced an obviously bad interaction: the pan tip appeared, the user panned, did something else, and then saw the pan tip again. Even if that pan was accidental and should not prove mastery, it proves that another pan reminder is unnecessary for a while.

Experience level and `lastUsedAt` must therefore be evaluated together.

## Current eligibility rules

Apply a universal fast guard first:

- If the action was used less than 60 seconds ago, skip its tip.

Then evaluate the experience level and age of `lastUsedAt`:

| Experience level | When its tip may become eligible |
|---|---|
| `not-experienced-yet` | Immediately when a caller proposes it |
| `tried-once` | Not again on the same local calendar day; on a later day, treat it like an unexperienced action because the first use may have been accidental |
| `may-know-it` | After at least one week without successful use |
| `knows-it` | After at least one month without successful use |

The 60-second rule is intentionally explicit even where a longer level-specific interval also suppresses the tip. It is the immediate protection against the app repeating a suggestion moments after the user followed it.

The implemented selection shape is:

```js
function maySuggestTip(candidates = []) {
  for (const tip of candidates) {
    if (isEligibleByExperienceAndRecency(tip)) return tip
  }

  return null
}
```

Tip policies remain configurable per experience. The recency schedule above is the default current direction; a particular interaction may later justify a stricter or looser schedule without changing the priority-selection contract.

`maySuggestTip` reads each experience's full persisted record, not only the derived `experienceLevels` map. It compares `lastUsedAt` against one shared `now` value for the whole candidate evaluation, and `tried-once` uses the user's local calendar day rather than an elapsed 24-hour approximation.

## Priority behavior

Candidate order is meaningful. If the first candidate is suppressed by experience or recency, evaluate the next candidate. If none is eligible, return `null` and make the selected tip state empty.

Current contextual requests are:

| Context | Candidate tips in priority order |
|---|---|
| Click zoom-in or zoom-out | `[zoom, pan]` |
| Click fit-all or restore-view | `[pan, zoom]` |
| Single canvas click after the double-click delay | `[addNode, pan]` |
| Start drawing a selection rectangle | `[pan]` |
| Successfully create a connection | `[removeConnection]` |
| Single connection click after the double-click delay | `[removeConnection]` |

Successful completion of scroll zoom, middle/Space pan, double-click node creation, or double-click connection removal calls `maySuggestTip([])` when there is no next candidate. The empty result removes the current tip immediately.

</tip-selection>

<decision-history>

# Decision history and superseded approaches

1. **Persist experience instead of booleans.** Experience records include a level, `lastUsedAt`, and bounded learning evidence.
2. **Use four levels.** The selected names are `not-experienced-yet`, `tried-once`, `may-know-it`, and `knows-it`.
3. **Avoid unlimited event history.** Storing every timestamp or a lifetime count was rejected as noisy and not useful enough.
4. **Avoid overlapping rolling counters.** Counts for the last 200 minutes, 3 days, week, and month largely count the same events repeatedly. V1 instead records capped practice and spaced-return evidence.
5. **Do not equate a burst with durable learning.** Ten uses in five minutes can establish present fluency but cannot prove next-day retention.
6. **Version the persistence key.** V1 remains stored when later strategies are introduced so migration remains possible.
7. **Start with an empty status bar.** The earlier persistent combined navigation tip was replaced by contextual, separately keyed pan, zoom, and add-node tips.
8. **Use prioritized contextual suggestions.** `maySuggestTip` replaced direct tip selection at controls and canvas interaction points.
9. **Allow per-tip policies.** The first policy showed zoom and add-node through `tried-once`, showed pan through `may-know-it`, and never showed a tip at `knows-it`.
10. **Remove trackpad wording.** `Trackpad to pan` was inaccurate guidance for the experience being taught; the pan tip now names only Space-drag and middle-drag.
11. **Clear a followed tip immediately.** Successful taught actions now call `maySuggestTip`, including with `[]`, rather than directly retaining or clearing an unrelated key.
12. **Supersede level-only eligibility with level plus recency.** The prior policy allowed pan to reappear immediately after a successful pan. The implementation adds recent-use suppression and eventually permits reminders for `may-know-it` and `knows-it` after one week and one month respectively.

</decision-history>

<open-questions>

# Possible later refinements

These are possibilities, not current decisions:

- Store `lastSuggestedAt` separately from `lastUsedAt` if repeated ignored tips become noisy. This would support a reminder cooldown without pretending the action was used.
- Record whether a shown tip was followed before another unrelated action. That could distinguish successful teaching from a tip that was merely dismissed by activity.
- Allow experience-specific recency thresholds if observation shows that node creation, zooming, and panning are forgotten at materially different rates.
- Revisit local-calendar-day suppression versus a rolling 24-hour interval if midnight boundary behavior feels surprising.
- Introduce v2 rather than mutating v1 if the stored evidence shape or learning model changes materially.

</open-questions>
</guide>
