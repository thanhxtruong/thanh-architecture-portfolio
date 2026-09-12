---
title: "Controlling stale writes in an ERP-to-portal sync"
publish: true
type: project
date: 2026-05-25
description: "One symptom — a write gets dropped — with three unrelated root causes. Separating them was the whole job."
tags: [case-study]
featured: true
featured_order: 3
focus: "Design & guide"
project_status: "Engineering case"
period: "2026"
summary: "Separated arrival ordering, retry reordering, and concurrent user intent so each failure mode received the control it actually required."
my_contribution: "Modeled the interleavings, separated stale delivery from lost updates, and documented the controls and their boundaries."
demonstrates: "reasoning about concurrency, invariants, and controls that match distinct problem classes"
facts:
  - value: "3"
    label: "root causes separated"
  - value: "1"
    label: "monotonic version invariant"
evidence:
  - kind: "Failure model"
    title: "Three similar symptoms, three different controls"
    summary: "Scenario traces distinguish stale arrival, obsolete retries, and genuine concurrent intent."
---

<p class="eyebrow">Case study · Distributed systems</p>

<div class="doc-meta">
<span>~12 min read</span>
<span class="doc-meta-faint">version-guarded writes · outbox · optimistic concurrency</span>
</div>

We keep an internal copy of records that originate in an external ERP. Changes flow out as events and land through an **outbox** on our side, so a user action and its propagation are decoupled. The ERP stamps every record with a monotonically increasing **version number** (the OVN) — the only trustworthy signal for "which version is newer," since timestamps across two systems and a bus can't be trusted for ordering.

The goal: **never regress to an older version than one we've already seen**, no matter how events and writes interleave. "Last write wins" is a bug here, because "last to arrive" isn't "last in truth." There turned out to be three distinct ways a stale write could sneak in — each needing its own control.

> [!scenario] An inbound event overtakes a queued write
> **Root cause: arrival ordering**
>
> A portal edit stages an outbox entry at OVN `n+1` that hasn't drained. The ERP emits its own event for the same record at OVN `n` — older, but on a shorter path, so it lands first. Applied blindly, the store briefly serves a version we already know is superseded.
>
> > [!control] Control — version-guarded writes
> > Every write carries its OVN and applies only if `incoming > current`. The stale `n` is compared and dropped. Arrival order stops mattering; only version order does. The comparison and write are one atomic operation, so it can't be raced.

> [!scenario] Two of our own writes race each other
> **Root cause: drain parallelism**
>
> Two quick edits stage `n+1` then `n+2`. With any drain parallelism or retry reordering, `n+2` can land first. The guard already keeps this _correct_ — the late `n+1` fails `n+1 > n+2` and drops — but a naive retry loop would thrash re-attempting it.
>
> > [!control] Control — retire, don't retry
> > Treat a guard-rejected entry as successfully obsolete, not failed: acknowledge and drop it. A superseded write isn't an error to recover from; it's a no-op to retire. That distinction is what keeps the outbox from generating phantom retry load.

> [!scenario] Two users on the same snapshot
> **Root cause: concurrent intent — a different problem class**
>
> Two users both load at OVN `n` and both edit, each staging `n+1` with a _different_ real change. The monotonic guard doesn't save us: it applies the first `n+1`, then drops the second as "not greater" — silently eating a real edit. This is a lost update, not a stale duplicate.
>
> > [!control] Control — optimistic concurrency at edit time
> > Reject the second save back to the user on the stale snapshot, with reload-and-reapply, so the conflict surfaces to a human instead of being resolved by silent last-write-wins. Recognizing that an identical symptom had two unrelated causes is the architectural point — conflating them would have shipped a control that quietly discarded real edits.
