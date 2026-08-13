---
title: "Use Service Bus topics for telemetry fan-out"
publish: false
date: 2026-06-02
description: "One inbound telemetry stream, three independent consumers each needing the full stream. Topics vs. queues vs. Event Hubs — and why streaming was the right tool for the wrong problem."
tags: [adr]
status: accepted
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span>2026-06-02</span>
<span class="doc-meta-faint">deciders: me (proposing), squad architect (reviewing)</span>
</div>

### Context

Device telemetry arrives as a continuous stream of events. Three independent consumers need it: a **customer portal** showing near-real-time status, an **operations** pipeline raising service tickets on faults, and a **partner analytics** rollup. The three are genuinely independent — different rates, different uptime expectations, and one failing must not stall the others. Each needs its **own copy** of every event.

Volume sits in the low thousands of events per minute, with headroom but no near-term order-of-magnitude jump expected. The team operates Azure Service Bus in production; it has no experience operating a partitioned streaming log. The decision: **how do we distribute one telemetry stream to multiple independent consumers?**

### Options considered

> [!option-rejected] Single queue, competing consumers
> A queue is point-to-point. Competing consumers *split* messages between them; they don't each get the full stream. Giving three consumers three full copies would push routing into application code that the messaging layer exists to handle. Wrong tool for a fan-out shape.

> [!option-rejected-for-now] Event Hubs
> The "correct" answer at high scale: consumer groups each read the full stream, with replay and stream analytics. Rejected only for now — it solves a throughput problem we don't have, shifts real operational complexity (offsets, partition ordering, rebalancing) onto a team with no streaming experience, and makes us build the per-consumer dead-lettering that topics give natively. Buying capability we don't need at a complexity cost we'd feel immediately.

> [!option-chosen] Service Bus topics + subscriptions
> One subscription per consumer. Each gets an independent copy of every message, its own dead-letter queue, its own delivery state, and optional per-subscription filtering. Maps exactly onto "three independent consumers, each needs the full stream, each fails independently" — at a scale the technology handles comfortably, on infrastructure the team already operates.

### Decision

Use a **Service Bus topic with one subscription per downstream consumer.** Independent-copy-per-subscriber semantics match the problem directly, per-subscription dead-lettering isolates failure for free, and we stay on infrastructure the team can operate with confidence.

### Consequences

> [!consequence-positive] Positive
> Consumers fully decoupled and fail independently. Per-subscription DLQs isolate poison messages. Filters route subsets without new topics. No new operational knowledge required.

> [!consequence-cost] Accepted costs
> Higher per-message cost than a streaming log at scale. A throughput ceiling we sit under but must monitor. No replay — once consumed from a subscription, a message is gone.

> [!consequence-revisit] Revisit trigger
> Reconsider Event Hubs if sustained volume approaches the topic ceiling, we need to replay history to rebuild consumer state, or we add a stream-analytics consumer that wants a partitioned log natively.
