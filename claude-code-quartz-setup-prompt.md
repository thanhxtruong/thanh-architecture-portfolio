# Claude Code brief: publish an architecture portfolio with Quartz, matched to a provided mockup

## Goal

Set up a Quartz static site that publishes a personal software-architecture portfolio, and theme it to match a provided HTML design mockup as closely as possible. The portfolio has three content types — **decision records (ADRs)**, **case studies**, and **on-practice notes** — authored as Markdown in a separate, private Obsidian vault and copied here after sanitization.

**This Quartz repo is intentionally separate from the private Obsidian vault.** The vault contains private learning notes, raw drafts, and unsanitized work material that must never reach a public host. This repo contains _only_ the Quartz machinery and already-sanitized portfolio content. The separation is structural: private material is never copied in, so the repo can safely be public. Do not symlink to, reference, or import from any external vault directory.

Two things matter above all else, in order:

1. **Do not leak private content.** This portfolio is derived from work at a company with confidentiality obligations. The publish gate must be fail-safe. Getting this wrong is the only unrecoverable error here.
2. **Match the mockup's visual design.** The file `architecture-portfolio-mockup.html` (provided in this repo) is the authoritative design spec. Read it and reproduce its look.

## Environment & references

- Quartz is currently on **v5** (a fresh clone gives v5). It requires **Node 22+** and **npm 10.9.2+**. Verify with `node -v` before starting.
- **Consult the current official Quartz docs at https://quartz.jzhao.xyz for the exact, up-to-date APIs** for theming (`quartz.config.ts` theme block), custom CSS (`quartz/styles/custom.scss`), layout (`quartz.layout.ts`), and custom components (`quartz/components/`). Do not assume the component API from memory — v5 may differ from older tutorials. Where this brief and the live docs disagree on API specifics, the docs win.
- The design source of truth is `architecture-portfolio-mockup.html`. Extract exact colors, fonts, spacing, and component structure from its CSS. The token summary below is a convenience, but the file is authoritative.

## Hard constraints — the publish gate (do this before any content or theming)

This repo is separate from the private vault. It contains only Quartz + sanitized content:

```
quartz-portfolio/              ← THIS repo (public-safe)
├── content/                   ← Quartz content root; contains ONLY sanitized portfolio pieces
│   ├── index.md               → landing page
│   ├── decisions/             → Layer 1 ADRs
│   │   ├── index.md
│   │   └── YYYY-MM-DD-slug.md
│   ├── work/                  → Selected engineering work
│   │   ├── index.md
│   │   └── slug.md
│   ├── notes/                 → Supporting notes
│   │   ├── index.md
│   │   └── slug.md
│   ├── about.md               → dedicated about page
│   ├── resume.md              → optional HTML résumé
│   └── attachments/           → sanitized images, diagrams, and résumé PDF ONLY
├── templates/                 → note templates (for reference; not built by Quartz)
├── architecture-portfolio-mockup.html   → design spec
├── quartz.config.ts
└── …                         → Quartz machinery
```

```
vault/                         ← PRIVATE vault (separate repo or no repo — never touches this one)
├── portfolio/                 ← author drafts here, copy sanitized versions into quartz-portfolio/content/
├── _learning/                 ← private, never leaves the vault
├── _drafts/                   ← private, never leaves the vault
└── _attachments-private/      ← private images, never leaves the vault
```

The primary safety property is structural: private material never enters this repo at all — it stays in the vault, and only already-sanitized pieces are copied into `content/`. The repo can safely be public because it contains nothing that shouldn't be. The workflow: author and sanitize in the vault → copy the finished piece into `content/` in this repo → commit and push.

Implement defense in depth on top of the structural separation:

1. **Opt-in publish filter.** In `quartz.config.ts`, use `Plugin.ExplicitPublish()` in the `filters` array so ONLY notes with `publish: true` in frontmatter are ever built. This is a second gate: even if a half-finished piece is accidentally copied in without its flag flipped, it won't render.
2. **`ignorePatterns`** in the configuration block as a backstop: include `["templates", ".obsidian"]`.
3. **Attachment awareness.** Quartz's publish filter applies to Markdown only — any non-Markdown file (image, PDF) under the content root is emitted publicly and reachable by direct URL even if nothing links it. Only sanitized assets should exist in `content/attachments/`.
4. **No symlinks to external directories.** Do not symlink `content/` or any subfolder to the vault. Content lives in this repo by copy, not by reference — symlinks would break CI builds AND blur the sanitization boundary.

**Checkpoint — STOP and report after implementing the gate.** Prove it works before continuing:

- Create a throwaway note under `content/` WITHOUT `publish: true`, run `npx quartz build`, and confirm it does NOT appear in the `public/` output.
- Place a throwaway image under `content/attachments/` with a random name, build, and confirm you CAN reach it at its URL in `public/` (this proves the attachment-awareness warning is real — non-Markdown files bypass the publish filter).
- Remove the throwaway files after the checks.
- Report the content-root path you configured and the results of both checks. Wait for confirmation before proceeding to real content.

## Setup steps

1. Scaffold Quartz: `git clone https://github.com/jackyzha0/quartz.git`, `cd quartz`, `npm i`, `npx quartz create` (choose the **obsidian** template, content directory is the default `content/`), then `npx quartz plugin install --from-config`.
2. Set up the folder structure inside `content/` per the diagram above (`work/`, `decisions/`, `notes/`, and `attachments/`, with section indexes in the first three folders). Create `about.md` and the optional `resume.md` at the content root. Create `templates/` at the repo root (outside `content/`, so Quartz ignores it) for the note templates.
3. Implement and verify the publish gate. **Checkpoint.**
4. Establish content structure and frontmatter schema (below).
5. Global theming to match the mockup.
6. Signature components.
7. Landing page.
8. Final verification and local preview.

## Content structure & frontmatter schema

Folders under `content/`: `work/`, `decisions/`, `notes/`, and `attachments/`, plus root-level `index.md` (landing), `about.md`, and optional `resume.md`. The first three folders each have an `index.md` section page.

Frontmatter every content note uses:

```yaml
---
title: <string>
publish: false # flipped to true only when ready
date: YYYY-MM-DD
description: <one sentence — used as the card preview>
tags: [adr | case-study | practice, ...]
status: accepted # ADRs only: proposed | accepted | superseded
supersedes: "[[slug]]" # ADRs only, optional
superseded-by: "[[slug]]" # ADRs only, optional
---
```

Folders map to the three nav sections. `date` renders on the page; `description` feeds the card listings; `tags` build tag pages; wikilinks in `supersedes`/`superseded-by` should produce working backlinks.

## Design tokens (from the mockup — authoritative values)

**Color**

- paper `#E4E6E0`; paper-raised `#EFF0EB`; paper-raised-2 `#F4F5F0`
- ink `#181B19`; ink-soft `#565E58`; ink-faint `#8A918B`
- petrol (primary accent) `#114E47`; petrol-bright (hover) `#18675C`
- amber (superseded / rejected-for-now only) `#8C591D`
- hairline `rgba(24,27,25,0.14)`; hairline-strong `rgba(24,27,25,0.26)`
- Background has a faint petrol radial wash in the top-right corner.

**Type** — load from Google Fonts.

- Serif: **Spectral** (weights 300–800 + italic) — ALL prose and headings.
- Mono: **IBM Plex Mono** (400/500/600) — the metadata layer ONLY: eyebrow labels, dates, status, filenames, tags, and inline version tokens like `n+1`.
- This serif/mono split is meaningful: serif = argument, mono = machine-fact. Preserve it.
- Base body ~18px, line-height ~~1.62. Headings tight tracking (~~-0.01 to -0.02em). Eyebrow/label text: mono, uppercase, letter-spacing ~0.14–0.16em, petrol or faint.

**Structure & motifs**

- Left rail: sticky, with a serif wordmark, a mono role line, and a numbered "Contents" nav (`01 Decisions`, `02 Case studies`, `03 On practice`) with per-section counts, plus a small mono "Note" about content being sanitized. Collapses to top on narrow screens.
- Eyebrow labels above titles (mono, with a trailing hairline that fills remaining width).
- Section rules = thin hairlines.
- Index cards: paper-raised, thin border, a 2px left border that turns petrol on hover, subtle lift on hover; a mono meta line (status pill + date + filename), serif title, serif one-liner.
- Small radii (2–3px), precise/flat feel — no heavy shadows, no large rounded corners.
- Gentle fade-up on scroll (respect `prefers-reduced-motion`); focus-visible outlines in petrol.

## Signature components (content-derived — need authoring conventions + custom CSS/components)

These are the distinctive elements. Each needs a small authoring convention (a callout type or directive the author writes in Markdown) plus rendering. Choose the most robust mechanism available in current Quartz (Obsidian-style callouts styled via CSS are a good candidate; a custom component or directive is fine too). **Document whatever convention you implement, and update the note templates in `templates/` (repo root, outside `content/`) to use it.**

1. **Status pill** — from the `status` frontmatter field: a small mono uppercase label with a colored dot. `accepted` → petrol dot; `superseded` → amber dot; `proposed` → faint. Rendered in the article header and in the card listing meta line.

2. **Decision spine** (ADR "Options considered") — a vertical spine connecting each option. Rejected options: hollow ring marker, option name struck-through, dimmed to ink-soft, with a mono "Rejected" (or amber "Rejected — for now") tag. The chosen option: filled petrol dot marker, full-ink name, solid petrol "Chosen" tag. This visually encodes "the roads not taken" and is the single most important element to get right.

3. **Scenario blocks** (case studies) — numbered blocks (`01`, `02`, …) each with a serif heading, a mono "root cause" kicker, body prose, and a "Control" callout with a petrol left border.

Match the exact look in `architecture-portfolio-mockup.html` (search it for `.fork`, `.opt`, `.scenario`, `.status`, `.card`, `.rail`, `.eyebrow`).

**Do NOT reproduce** these mockup-only framing elements: the fake browser chrome bar, the "Mockup · Quartz" tag, and the centered "Reading view" divider (that divider existed only to show the index and an article together on one mockup page; the real site has separate pages).

## Landing page (`content/index.md`)

Reproduce the mockup's hero: mono eyebrow "Portfolio · Software architecture", a large serif headline, and a one-sentence lede. Below it, the three-layer index — a titled section per content type (`01`/`02`/`03`), each listing its notes as cards driven by the folder's contents and frontmatter (`title`, `description`, `date`, `status`). If a custom listing component is needed to produce the card layout, build it.

## Final verification

- `npx quartz build` completes with no errors; TSX/SCSS compile.
- Re-run the two gate checks (unpublished note absent from `public/`; private image absent from `public/`).
- `npx quartz build --serve` runs; report the localhost URL so the site can be previewed and visually compared against the mockup.
- Summarize: the content-root path, the publish mechanism, the authoring conventions you introduced for the signature components (and how the templates were updated), and any place where matching the mockup required a compromise or is likely to need visual iteration.

## Working style

- Prefer the smallest change that achieves the look; don't restructure Quartz internals unnecessarily, so future `npx quartz upgrade` stays clean.
- When unsure about a v5 API, check the live docs rather than guessing.
- The publish gate and the two verification checks are non-negotiable; everything visual is iterable.
