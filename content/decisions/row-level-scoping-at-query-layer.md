---
title: "Enforce row-level data scoping at the query layer"
publish: true
date: 2026-05-19
description: "Preventing cross-audience data exposure (IDOR) as a deterministic boundary in the persistence layer, distinct from role checks above it."
tags: [adr]
status: accepted
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span>2026-05-19</span>
<span class="doc-meta-faint">deciders: me (proposing), tech lead (reviewing)</span>
</div>

### Context

The portal serves multiple audiences — each should see only their own data. The existing pattern applied audience checks in the API controller before querying the database. This works when every code path remembers to check, but a single missed filter means a user can see (or modify) another audience's records. The question: **where should the audience boundary be enforced?**

### Options considered

> [!option-rejected] Controller-level checks
> Add a guard in each API endpoint that validates the caller's audience against the requested resource. This is the existing pattern. It works, but it's opt-in — every new endpoint must remember to add the check. A single miss is an IDOR vulnerability, and the miss is silent (no compile error, no test failure unless you write a test for that specific case).

> [!option-chosen] Query-layer scoping
> Inject the audience filter into the query pipeline itself, so every database query is scoped by default. A developer would have to actively *remove* the filter to query across audiences. The boundary becomes a property of the data layer, not a convention in the application layer.

### Decision

Enforce row-level data scoping at the query layer. Every query passes through a pipeline that appends the audience filter. Opting out requires an explicit, reviewable bypass — not a silent omission.

### Consequences

> [!consequence-positive] Positive
> Cross-audience data exposure becomes structurally impossible by default. New endpoints inherit the boundary without developer action. Code review focuses on the rare opt-out, not the common case.

> [!consequence-cost] Accepted costs
> Slight additional complexity in the query pipeline. Developers must understand the scoping mechanism to debug unexpected empty results. Cross-audience queries (for admin tooling) require explicit bypass, adding friction.

> [!consequence-revisit] Revisit trigger
> If the scoping model needs to support more complex access patterns (e.g., shared records across audiences, hierarchical permissions), the current binary filter may need to evolve into a more expressive policy engine.
