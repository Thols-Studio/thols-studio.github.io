# Prompt.md — Testing Another Model on the TubeVault Docs

This file defines how to test a **second model** against the TubeVault /
TholsStudio documentation in `docs/`. It covers two distinct goals and the
recommended prompts for each. Pick the goal that matches what you want to learn.

> Prerequisite: the documentation lives in `docs/` (see `docs/INDEX.md`).
> - `docs/bundle.md` — all docs concatenated into one file.
> - Individual phase docs + `PRD.md` / `TDD.md` / `Tasks.md` / `workflow.md` /
>   `MAINTAIN.md`.

---

## Important: what the docs contain

The docs are **design + snippets**, not the full source. `phase1-appjs.md` and
`phase2-buildjs.md` include function signatures, line references, and
*representative* code snippets — but **not** the complete `app.js` (~3196 lines)
or `build.js`. Therefore:

- Feeding **only `docs/bundle.md`** → the model **reconstructs its own
  implementation** from the description. It will be *functionally similar* (same
  function names, data model, token approach) but the exact code, edge cases,
  and the bug-fixes we applied may differ — it could even reintroduce the bugs
  we fixed.
- Feeding **the real source files + docs** → the model can **verify/audit**
  against our actual code (byte-faithful comparison), not regenerate.

Choose the prompt set below based on your goal.

---

## GOAL A — Reconstruction (does the model understand the design well enough to rebuild an equivalent project?)

**Inputs to the model:** `docs/bundle.md` (single file) — or `docs/INDEX.md`
plus the individual docs.

**Prompt A1 (full rebuild):**
```
Read docs/bundle.md. It describes TubeVault / TholsStudio — a dependency-free,
client-side YouTube video vault built as static pages. Reconstruct the COMPLETE
project from the design:

1. page-template.html      (with tokens {{APP_NAME}}, {{APP_LABEL}},
   {{APP_COLOR}}, {{JS_DIR}}, {{SCRIPT_TAGS}}, {{BUILTIN_APPS_JS}})
2. app.js                  (the shared engine)
3. build.js                (Node build script)
4. delete-category.js      (Node delete script)
5. categories.json         (manifest with unity3d, gamedesign, blender, csharp)
6. The seed-file generators used by build.js
   (collections / playlist / watched starters + window.__BUILTIN_APPS__)

Requirements:
- Zero runtime/build dependencies (plain Node + vanilla browser JS).
- build.js must generate starter seed files ONLY if missing (skip-if-exists)
  so curated data survives re-runs; HTML + page-template.js are always regenerated.
- The category list must come from categories.json everywhere (HTTP fetch in
  app.js; a generated window.__BUILTIN_APPS__ injected into every page for
  file://; delete-category.js reads categories.json). No stale hardcoded list.
- Include the shared makeSortable() drag helper and the playlist split-view player.
Output each file in full. Then run through Tasks.md Phase 9 verification
mentally and list any step you could not satisfy and why.
```

**Prompt A2 (focused — engine only):**
```
Read docs/phase1-appjs.md and docs/phase0-scaffold.md. Implement app.js + the
page-template.html script-load order exactly as described. Pay special attention
to: COLLECTION_COLORS being defined before app.js init, seedData() flattening
DEFAULT_COLLECTIONS into state.videos, and isVideoInPlaylist() matching by
YouTube videoId. Output app.js in full.
```

**What to check afterward:** diff the model's output against our real
`app.js` / `build.js`. Expect *conceptual* match, not byte match. Look
specifically for whether it avoided the three historical bugs (missing seeds,
stale BUILTIN_APPS, build dead-end).

---

## GOAL B — Verification / Audit (does the model reproduce OUR exact code / find drift & bugs?)

**Inputs to the model:** the **real source files** + `docs/bundle.md`.

Recommended: copy the actual code into a `sources/` folder next to `docs/`:
```
youtube/
  docs/bundle.md
  sources/
    app.js  build.js  delete-category.js  page-template.html
    style.css  categories.json  tests.js  maintain.html
    unity3d/unity3d-collections.js   (one seed example)
```

**Prompt B1 (audit against design):**
```
Read docs/bundle.md (the design) AND the files in sources/ (our actual code).
Audit the code against the documented design. Report:
1. Any place where the code DRIFTS from the design (e.g. a hardcoded category
   list that should come from categories.json, a seed file overwritten on
   rebuild, a missing {{TOKEN}} substitution).
2. Any of the three historical bugs that are STILL present or could regress:
   (a) missing seed files breaking first load (undefined COLLECTION_COLORS),
   (b) stale BUILTIN_APPS pointing at non-existent pages,
   (c) build.js generating a page with no working seeds.
3. A PASS/FAIL per Tasks.md Phase 9 verification step, with evidence.
Be concrete: cite file + function + line.
```

**Prompt B2 (reproduce-from-sources, not regenerate):**
```
The files in sources/ are the canonical TubeVault implementation. Do NOT rewrite
them. Instead: (1) explain how build.js turns page-template.html + categories.json
into the generated pages; (2) trace the exact page-load script order and why each
global (APP_*, window.PAGE_TEMPLATE, DEFAULT_COLLECTIONS, window.__BUILTIN_APPS__)
must exist before app.js init; (3) list every surface that reads categories.json
and its file:// fallback. Keep answers tied to the actual code.
```

**What to check afterward:** the model should NOT invent new code in B; it
should cite our files. If it tries to "fix" working code, that's a sign the
prompt framing (verification vs regeneration) was ambiguous — use B2.

---

## GOAL C — Capability probe (lightweight)

**Prompt C:**
```
Read docs/INDEX.md, then docs/PRD.md and docs/TDD.md. In under 300 words,
summarize: (1) the single source of truth for the category list, (2) why
build.js uses skip-if-exists on seeds, (3) how the file:// fallback avoids drift.
Then state whether adding a 50th category page would be a performance burden and why.
```

Use this to quickly gauge comprehension before a heavier A/B task.

---

## Decision guide

| You want to know… | Goal | Inputs | Prompt |
|-------------------|------|--------|--------|
| Can it rebuild an equivalent project? | A | `docs/bundle.md` | A1 / A2 |
| Does our code match the design / any bugs? | B | sources + `docs/bundle.md` | B1 / B2 |
| Quick comprehension check | C | `docs/INDEX.md` + PRD/TDD | C |

## anti-ambiguity tips
- Always state **reconstruct** vs **verify/audit** explicitly — models default to
  generating, which is wrong for Goal B.
- For Goal B, tell the model the sources are **canonical** and not to rewrite.
- For Goal A, tell the model the docs are the **only** spec (no hidden files).
- After any run, diff against the real `youtube/` source and report concrete
  matches/mismatches rather than trusting a self-reported "done".
