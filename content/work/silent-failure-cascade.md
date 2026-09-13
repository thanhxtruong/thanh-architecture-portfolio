---
title: "Following a silent failure four levels deep"
publish: true
type: project
date: 2026-08-22
description: "Four fixes, each one assuming the failure was contained — and each one wrong about where the boundary actually was."
tags: [case-study]
aliases:
  - case-studies/silent-failure-cascade-erp-outbox
featured: true
featured_order: 1
focus: "Investigate & improve"
project_status: "Production investigation"
period: "2026"
summary: "Traced a duplicate-contract incident through timeout configuration, competing write paths, a poisoned ORM context, and a shared batch scope."
my_contribution: "Investigated the cascading failure and implemented timeout, recovery-scope, per-entry-scope, and batch-containment changes."
demonstrates: "evidence-led debugging, failure containment, and revising earlier assumptions"
facts:
  - value: "4"
    label: "containment boundaries traced"
  - value: "1 / entry"
    label: "ORM scope after isolation"
---

<p class="eyebrow">Case study · Distributed systems</p>

<div class="doc-meta">
<span>~15 min read</span>
<span class="doc-meta-faint">outbox · ERP integration · scope isolation · failure cascades</span>
</div>

A production incident created a second, genuinely separate billable contract in an external ERP for a subscription that already had one. Four independent decisions — each correct when it was made — chained together to produce it.

What makes this worth writing up isn't the bug. It's that I fixed it four times. Each fix addressed a real mechanism and each one left me believing the failure was contained. Each time, the blast radius extended one boundary further than I'd checked. The pattern in my own reasoning turned out to be more useful than any individual fix.

> [!artifacts] Artifacts in this case study
>
> - [Boundary diagram: four propagation layers](#artifact-boundary-diagram-four-propagation-layers)
> - [Containment map: entry state versus batch state](#artifact-containment-map-entry-state-versus-batch-state)

### Artifact: Boundary diagram: four propagation layers

<svg class="artifact-diagram" viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nested scope boundaries showing a failure escaping four successive containment assumptions">
  <defs>
    <marker id="leak" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#b4533a"/>
    </marker>
  </defs>

  <rect x="20" y="20" width="660" height="360" rx="6" fill="none" stroke="#8a8578" stroke-width="1.5"/>
  <text x="34" y="42" font-family="ui-monospace, monospace" font-size="12" fill="#6b6559">batch loop — no per-entry containment</text>

  <rect x="52" y="62" width="596" height="286" rx="5" fill="none" stroke="#8a8578" stroke-width="1.5"/>
  <text x="66" y="84" font-family="ui-monospace, monospace" font-size="12" fill="#6b6559">shared ORM context — one per batch, not per entry</text>

  <rect x="84" y="104" width="532" height="212" rx="4" fill="none" stroke="#8a8578" stroke-width="1.5"/>
  <text x="98" y="126" font-family="ui-monospace, monospace" font-size="12" fill="#6b6559">entry processing — recovery write reuses failed context</text>

  <rect x="116" y="146" width="468" height="138" rx="4" fill="none" stroke="#8a8578" stroke-width="1.5"/>
  <text x="130" y="168" font-family="ui-monospace, monospace" font-size="12" fill="#6b6559">persistence — exception caught and dropped</text>

  <rect x="148" y="190" width="404" height="62" rx="3" fill="#f0ebe0" stroke="#b4533a" stroke-width="1.5"/>
  <text x="350" y="216" font-family="ui-monospace, monospace" font-size="13" fill="#b4533a" text-anchor="middle">unique-constraint violation</text>
  <text x="350" y="236" font-family="ui-monospace, monospace" font-size="11" fill="#8a6b5a" text-anchor="middle">where I assumed it stopped</text>

  <path d="M552,221 L600,221 L600,180" fill="none" stroke="#b4533a" stroke-width="1.5" marker-end="url(#leak)" stroke-dasharray="4 3"/>
  <path d="M584,160 L628,160 L628,140" fill="none" stroke="#b4533a" stroke-width="1.5" marker-end="url(#leak)" stroke-dasharray="4 3"/>
  <path d="M616,120 L656,120 L656,98" fill="none" stroke="#b4533a" stroke-width="1.5" marker-end="url(#leak)" stroke-dasharray="4 3"/>
  <path d="M648,78 L672,78 L672,56" fill="none" stroke="#b4533a" stroke-width="1.5" marker-end="url(#leak)" stroke-dasharray="4 3"/>

<text x="36" y="370" font-family="ui-monospace, monospace" font-size="11" fill="#8a6b5a">each fix contained one boundary — the failure escaped the next one out</text>
</svg>

> [!artifact-note] Reading the artifact
> **Establishes:** The same constraint violation crossed four distinct containment assumptions: persistence handling, entry processing, the shared ORM context, and the batch loop.
>
> **Does not prove:** The diagram shows the reconstructed propagation path, not timing, frequency, or the relative production impact of each layer.

## The system

An outbox dispatcher delivers subscription writes to an external ERP. The ERP's contract creation is irreversible and billable — the governing constraint behind every error-handling decision in this flow. A separate, event-driven path independently receives notifications from the ERP and maintains local records. Both paths can write to the same local subscription record.

The invariant: never invoke the ERP a second time for a subscription that already has a contract.

## The symptom

A subscription record whose outbox entry was marked `Delivered`, but whose ERP-assigned identifiers — contract ID and contract number — were permanently `NULL`. The ERP had created the contract. Our system had confirmed delivery. But the local record had no proof.

And a second, genuinely separate billable contract existed for the same subscription.

## The first explanation — and why it wasn't enough

The outbox entry's error detail on its first dispatch attempt read: _"The operation didn't complete within the allowed timeout of 10 seconds."_

The ERP routinely takes up to 30 seconds to process a contract-creation call. The typed HTTP client was registered with a standard resilience handler that configures two timeouts: a total-request budget (bound to config, set comfortably high) and a per-attempt timeout. The per-attempt timeout was never bound to config. It silently defaulted to 10 seconds.

So the ERP succeeded after ~12 seconds, committed the contract, and returned a response — but our client had already given up at 10 seconds, classified the call as a transient failure, and scheduled a retry. The local record's identifiers stayed `NULL` because we never saw the response.

My first reaction was that this was the fix: configure the per-attempt timeout explicitly, sized above 30 seconds, and the false timeout stops firing. I wrote the config change and considered the investigation closed.

It wasn't. The timeout explained why the _first_ attempt was misclassified, but it didn't explain why the retry — which succeeded and returned real identifiers — still left the record at `NULL`. If the retry worked, the identifiers should have been persisted. Something else was eating the successful response.

## The second layer — a race nobody was arbitrating

The ERP's real success (the one our client never saw) published a subscription-created event to the message broker. A separate event consumer processed it: looked up the local subscription record by ERP contract ID, intending to attach the identifiers to the existing record.

It found nothing. The original record still had `NULL` identifiers — because of the false timeout. So the event consumer, following its designed behavior, created a new "shell" record to hold the confirmed contract. Now two local records existed for the same ERP contract: the original (with a pending outbox entry, identifiers `NULL`) and the shell (with real identifiers, created by the event path).

A unique constraint on `(partner, contract ID)` prevented both from holding the same identifiers. When the outbox retry eventually succeeded and the dispatcher tried to persist the identifiers on the original record, it hit the constraint violation against the shell.

This was caught by design — an earlier architectural decision (the [idempotency guard](2026-07-30-erp-contract-persistence-idempotency-guard.md)) established that a local persistence failure must never trigger a retry that re-invokes the ERP, because the ERP's side effect is irreversible. So the exception was logged and dropped. The entry was marked `Delivered`. The identifiers stayed `NULL`.

I'd designed that catch block. It was doing exactly what I'd intended. But "caught by design" in this context meant "silently permanent" — the only evidence was a log line that would age out of retention. No alert, no retry of the local write, no queryable state.

This was the moment the investigation shifted from "find the bug" to "question the previous fix." The swallowed exception wasn't wrong in isolation — it was the correct response to the constraint it was designed under. But the constraint had assumed the persistence failure would be _transient_ (a deadlock, a timeout), not _structural_ (a duplicate record that wouldn't resolve on its own).

## The third layer — poison in the ORM context

A related but distinct incident surfaced during integration testing: two genuinely separate billable contracts created for one subscription. Not just a `NULL` identifier gap — an actual duplicate in the ERP.

The investigation traced back to the same constraint violation, but with a different downstream effect. The unique-constraint exception left the ORM's change tracker holding a dirty entity — the record it tried to update, still marked as `Modified` with the conflicting identifiers. The recovery write — designed to stash the ERP's response for a later retry of just the local save — reused the **same ORM context**.

When the recovery write called `SaveChangesAsync`, the ORM re-flushed _all_ tracked changes, including the dirty entity from the failed save. The identical constraint violation fired again. But this time it threw inside a `catch` block — the recovery path itself failed with the same exception it was trying to recover from.

The unhandled exception propagated out of the recovery method, past the dispatcher's outer error handling (which also reused the same context), and out to the top-level loop. No failure state was recorded on the outbox entry — no status change, no error detail, no pending-contract stash. The entry's processing lock expired, it was reclaimed by a later poll cycle, and redispatched as if nothing had happened. The pre-send idempotency guard checked the local record, found `NULL` identifiers, concluded no contract existed, and called the ERP. The ERP created a second contract.

The fix was straightforward once the mechanism was clear: the recovery write creates its own ORM context via a fresh DI scope, with no knowledge of the dirty entity. The poisoned change tracker stays contained to the scope that produced it. I shipped this and considered the scope-isolation problem closed.

## The fourth layer — the blast radius extended further

It wasn't closed. The fresh-scope fix isolated the recovery write from its own entry's poison. But I'd only followed the contamination one hop. The actual scope boundary was wider.

The dispatcher processed entries in batches. One ORM context was shared across the entire batch — not one per entry, one per _batch_. Entry N's failed `SaveChangesAsync` left a dirty entity on the context. Entry N+1 resolved its own, completely unrelated repository from the same context. When N+1 called `SaveChangesAsync` for its own legitimate write, the ORM re-flushed N's dirty entity alongside it. A failure in one entry silently corrupted the next.

This is an ORM anti-pattern with a name: the context is designed as a short-lived unit of work — created, used for one logical operation, and disposed. Using it across a batch of unrelated operations turns it into a captive dependency whose change tracker grows unbounded and whose failure state leaks across boundaries.

The fix: each entry in the batch gets its own DI scope, and therefore its own ORM context. A failure in entry N's change tracker can no longer contaminate entry N+1.

But even with per-entry scoping, the batch _loop itself_ had no containment. An unhandled exception from one entry's processing — any exception that escaped the entry's own internal error handling — propagated out of the loop, aborting every remaining entry in the batch. Those entries waited until the next poll cycle to be reclaimed, with no record of why they were delayed.

The final fix: the batch loop wraps each entry's dispatch in a try/catch (excluding cancellation, which should propagate to stop the loop cleanly). An unhandled exception from one entry is logged, and the loop continues to the next. This is a last-resort containment net — entries caught here aren't marked failed (the DI scope that failed can't be trusted for that write), so they rely on lock expiry for reclaim rather than immediate bookkeeping.

### Artifact: Containment map: entry state versus batch state

| Boundary                | Before                                                    | After                                                         |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| ORM context             | One change tracker was shared across the claimed batch.   | Each entry resolves a fresh context from its own DI scope.    |
| Recovery write          | Retried local persistence through the failed entry scope. | Uses an independent scope that cannot see the dirty entity.   |
| Batch loop              | One escaped exception aborted every later entry.          | Each dispatch is contained while cancellation still escapes.  |
| Last-resort bookkeeping | A failed scope could be reused to record its own failure. | Lock expiry reclaims work when the failed scope is untrusted. |

> [!artifact-note] Reading the artifact
> **Establishes:** The implemented boundaries separate an entry's mutable state from both recovery work and subsequent entries in the batch.
>
> **Does not prove:** The map does not show that every exception is recoverable, that delayed entries are immediately visible, or that lock-expiry recovery meets an operational latency target.

## What I learned

| What I fixed                | What I assumed was contained     | What actually wasn't                           |
| --------------------------- | -------------------------------- | ---------------------------------------------- |
| The false timeout           | The retry would handle it        | The retry's persistence was silently swallowed |
| The silent swallow          | The exception was safely caught  | The catch reused a poisoned ORM context        |
| The poisoned recovery write | The entry's failure was isolated | The ORM context was shared across the batch    |
| The shared batch context    | Each entry was independent       | The loop itself had no containment             |

The pattern is always the same: fix the immediate mechanism, then ask _what scope does this failure actually reach?_ Every time I assumed the blast radius stopped at the boundary I could see, there was another boundary I hadn't checked.

The second lesson is about "correct in isolation" versus "correct in composition." The 10-second timeout default was reasonable. The event consumer creating a shell record was correct given what it could see. The swallowed exception was a deliberately reasoned decision to prevent a worse outcome. The shared ORM context matched the pattern used everywhere else in the codebase. None of these were bugs. The bug was their interaction — and each needed its own fix because each was an independently-closeable link in a chain.
