---
title: "About"
publish: true
description: "How I approach substantial engineering work and the teams where I do my best work."
aliases:
  - resume
cssclasses:
  - portfolio-about-page
---

<p class="portfolio-page-links" aria-label="About page sections">
  <a href="#about">About</a>
  <a href="#resume">Résumé</a>
</p>

<div id="about" class="portfolio-section-anchor"></div>

## I stay close to the work.

I enjoy ambiguous engineering problems that require careful investigation, a maintainable implementation, and thoughtful production follow-through.

My work includes fullstack development, external-system integrations, persistence and concurrency, automated testing, technical reviews, and operational problem solving. Architectural judgment appears here as part of delivery: defining boundaries, surfacing hidden assumptions, weighing tradeoffs, and revising a decision when new evidence changes the calculation.

**Best fit:** a Senior Software Engineer role with ownership of substantial fullstack development and opportunities to improve both the system and the way the team reasons about it.

### How I contribute

- **Build across the stack.** I work from React interfaces through C# APIs and SQL Server persistence, keeping user-facing behavior connected to the system underneath it.
- **Investigate production behavior.** I trace failures across boundaries, reproduce the mechanism, and improve containment rather than stopping at the first visible symptom.
- **Make consequential decisions explicit.** I compare alternatives, document accepted costs, and revise an earlier choice when implementation or production evidence changes the tradeoff.

---

<div id="resume" class="portfolio-section-anchor"></div>

## Résumé

### Senior Software Engineer

I build and operate fullstack systems, with particular attention to external integrations, persistence, concurrency, failure recovery, and the boundaries where otherwise reasonable components interact badly.

| Focus                  | Practice                                                                          |
| ---------------------- | --------------------------------------------------------------------------------- |
| Fullstack delivery     | React, C#, SQL Server, APIs, and automated tests                                  |
| Production reliability | Failure analysis, recovery paths, observability, and operational follow-through   |
| Engineering judgment   | Design reviews, explicit tradeoffs, decision records, and maintainable interfaces |

### Selected engineering work

- **[[work/reliable-erp-outbox|Building a reliable ERP delivery pipeline]].** Implemented the dispatcher and unit-of-work seam, shaped retry and client contracts, and added real-database concurrent-claim verification.
- **[[investigations/silent-failure-cascade|Following a silent failure four levels deep]].** Traced a cascading production failure and implemented timeout, recovery-scope, per-entry-scope, and batch-containment changes.
- **[[work/stale-writes-erp-sync|Controlling stale writes in an ERP-to-portal sync]].** Modeled competing interleavings, separated stale delivery from lost updates, and documented the controls and their boundaries.

### What I’m looking for

A Senior Software Engineer opportunity with meaningful fullstack ownership, production responsibility, and room to contribute to system design.
