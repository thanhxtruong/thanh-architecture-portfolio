---
title: "ADRs and architecture docs are not the same document"
publish: true
date: 2026-05-10
description: "Two artifacts that fail in opposite ways — one immutable and about why, one living and about what. Conflating them undermines both."
tags: [practice]
---

<p class="eyebrow">On practice</p>

An Architecture Decision Record captures a **point-in-time decision**: what was decided, what was rejected, and why — written while the reasoning is fresh and left unchanged afterward. An architecture document describes **the current state of a system**: what exists today, how it fits together, and where to look — updated as the system evolves.

These two artifacts fail in opposite ways when you conflate them.

If you treat the ADR as a living document, you lose the historical record. The rejected alternatives, the constraints that shaped the choice, the reasoning that made option B look worse than option A — all of it gets overwritten when someone "updates" the ADR to reflect a later decision. The whole point of a decision record is that it's a snapshot of a moment of judgment. Edit it and you've destroyed the evidence.

If you treat the architecture doc as immutable, it rots. The system moves on, the doc doesn't, and within months it's a misleading artifact that new joiners read and form wrong mental models from. Architecture docs need to be updated or they actively harm.

The practical rule: **ADRs are append-only; architecture docs are mutable.** An ADR can be *superseded* by a later ADR (with a link), but the original stays intact. An architecture doc gets rewritten when the system it describes changes.

Teams that maintain both — a chronological log of decisions and a living map of the system — tend to onboard faster and argue less. Teams that try to combine them into one artifact end up with neither: a document that's too stale to trust and too edited to learn from.
