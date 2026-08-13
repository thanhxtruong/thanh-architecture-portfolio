---
title: "Poll the ERP on a fixed schedule"
publish: false
date: 2026-04-30
description: "An early decision, later superseded by event-driven sync. Kept in the record because the reasoning that turned out wrong is worth preserving."
tags: [adr]
status: superseded
superseded-by: "[[event-driven-erp-sync]]"
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-superseded"><span class="status-dot"></span>Superseded</span>
<span>2026-04-30</span>
<span class="doc-meta-faint">deciders: me (proposing)</span>
</div>

### Context

The portal needs a local copy of records from an external ERP. The ERP does not push events; the only integration surface is a REST API. The question: **how do we keep our local copy in sync?**

### Options considered

> [!option-rejected] Real-time webhook from ERP
> The ERP vendor offers no webhook or event mechanism. Building a polling adapter on their side was out of scope and out of our control. Not available as an option.

> [!option-chosen] Scheduled polling
> Poll the ERP API on a fixed interval (initially every 5 minutes), diff the response against local state, and apply changes. Simple, predictable, and within our control — but introduces inherent latency equal to the polling interval, and the diff logic must handle partial failures gracefully.

### Decision

Poll the ERP on a 5-minute schedule. Accept the latency tradeoff in exchange for simplicity and full control over the sync mechanism.

### Consequences

> [!consequence-positive] Positive
> Simple to implement and operate. No dependency on ERP-side infrastructure. Predictable load pattern on both sides.

> [!consequence-cost] Accepted costs
> Up to 5 minutes of staleness. Wasted API calls when nothing has changed. Diff logic adds complexity as the data model grows.

> [!consequence-revisit] Revisit trigger
> This decision was later superseded when the ERP vendor introduced an event feed. The event-driven approach eliminated polling latency and wasted calls, but the version-guarded write pattern developed during the polling era carried forward — it turned out to be necessary regardless of how changes arrive.
