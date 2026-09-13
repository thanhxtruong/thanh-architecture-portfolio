---
title: Persisting ERP-Assigned Identifiers and Guarding Against Duplicate External Contracts
publish: true
type: decision
date: 2026-07-30
description: When an outbox entry successfully creates a contract in an external ERP, the ERP's response must be persisted locally and a pre-send guard must prevent re-invocation on retry — because the ERP's side effect is irreversible, and a local persistence failure must never trigger a retry that creates a second billable contract.
tags: [adr]
status: accepted
decision_id: "ADR-030"
related_project: "[[work/reliable-erp-outbox]]"
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span>2026-07-30</span>
<span class="doc-meta-faint">deciders: me (proposing, in coordination with the architect and the ERP integration team)</span>
</div>

### Context

Three related gaps existed in the outbox dispatcher's handling of a successful ERP contract-creation call:

1. **The ERP's response was never persisted.** The typed HTTP client parsed a successful response into a result payload carrying the ERP-assigned contract identifiers (contract number, contract ID), but the dispatcher discarded the payload entirely — it only marked the outbox entry as delivered. Persistence of those identifiers relied solely on a separate, event-driven path: the ERP publishes a subscription-created event to the message broker, and a different service processes that event independently. The synchronous HTTP response was thrown away.

2. **No guard against re-invoking an already-created contract.** An outbox entry retried after a prior delivery attempt already succeeded in the ERP — but our system failed to record that success locally (e.g., the process timed out after the ERP committed but before the response was processed) — would re-POST to the ERP and risk creating a duplicate, billable contract for the same subscription.

3. **Certain ERP success codes arrived through a non-standard response path** that never carried a payload, so contract identifiers could never be captured for those cases even after fixing gap 1. _(This was later resolved by the ERP team changing their response format — see supporting decision 3 below.)_

### Options considered

#### When to guard against duplicate ERP calls

> [!option-rejected] Guard only at initial commit time
> Check whether a contract already exists when the user's enrollment is first committed (before the outbox entry is even created). Would have been the right choice if the outbox never retried — but retries can span minutes to hours, and a prior attempt may have succeeded in the ERP without being recorded locally. A check at commit time doesn't protect against re-invocation on retry.

> [!option-chosen] Guard on every dispatch attempt, immediately before the ERP call
> On each dispatch attempt, before invoking the ERP, check whether the local record already has ERP-assigned identifiers. If it does, the contract already exists (from an earlier delivery attempt or from the separate event-driven path) — skip the ERP call entirely, mark the entry as delivered, and log the short-circuit. This runs on _every_ attempt, not just the first, because the window between attempts is where the state can change.

#### How to handle a local persistence failure after ERP success

> [!option-rejected] Propagate the failure to the normal retry path
> Let the persistence exception bubble up to the dispatcher's outer catch block, which marks the entry as failed and schedules a retry with backoff. The retry would call the ERP again. Rejected because **by the time the persistence runs, the ERP has already committed the contract** — the side effect is irreversible. A retry that re-invokes the ERP creates a second, genuinely separate, billable contract. The normal retry path assumes the ERP call itself failed; using it after a _successful_ ERP call with a _failed local write_ is a category error.

> [!option-chosen] Isolate the persistence in its own error boundary, never retry the ERP call
> The contract-details persistence runs inside its own try/catch, deliberately separated from the dispatcher's outer error handling. A failure here is logged for manual reconciliation but never propagated to the retry mechanism. The reasoning: the worst outcome of a missed local write is a data gap that a human or reconciliation job can repair; the worst outcome of a duplicate ERP call is a second billable contract that requires cross-organization coordination to reverse.
>
> _(This isolation was later strengthened — see the [silent failure cascade case study](../work/silent-failure-cascade.md) — when a production incident revealed that the persistence failure could corrupt the ORM context and cascade into subsequent entries in the same batch.)_

### Decision

Close all three gaps with complementary mechanisms:

1. **Persist ERP-assigned identifiers on successful delivery.** After marking the entry as delivered, load the local subscription record by ID and save the contract number and contract ID from the ERP's response. This runs inside its own try/catch — a failure here is logged as an error for reconciliation, never propagated to the retry path.

2. **Pre-send idempotency guard, checked on every dispatch attempt.** Before invoking the ERP, check whether the local record already has ERP-assigned identifiers. If both are present, the contract already exists — skip the ERP call, mark delivered, log the short-circuit. This was the architect's key feedback: saving the response _after the fact_ (decision 1) only prevents overwriting bad data — it doesn't stop the ERP from being called again. The guard must check _before sending_.

3. **ERP success codes reclassified to carry the response payload.** After coordination with the ERP team, certain success-with-caveats response codes (previously returned as non-standard HTTP statuses without a parseable payload) are now returned as standard `2xx` responses with the full contract-identifier payload. The separate "succeeded pending manual intervention" outcome was removed — all success codes now flow through the same path, and contract identifiers are captured for every successful response. Ops visibility for the "needs manual follow-up" case is preserved via a warning-level log keyed on the specific HTTP status code, not via a separate result classification.

Supporting decisions:

- The pre-send guard requires _both_ identifier fields (contract ID and contract number) to be populated before short-circuiting. A record with only one of the two is treated as an inconsistent state and dead-lettered rather than dispatched — a partial write from a prior failed persistence attempt shouldn't be trusted as proof that the contract exists. _(A future improvement: query the ERP directly to resolve the inconsistency rather than dead-lettering, since the ERP does expose a lookup endpoint.)_
- A record that doesn't resolve at all (as opposed to one that resolves with null identifiers) is currently treated as "proceed to call the ERP normally." This hasn't been explicitly confirmed as the right behavior and is flagged as an open question.

### Runtime assumptions

- **Two independent write paths for the same identifiers.** The outbox dispatcher's synchronous HTTP response and the ERP's asynchronous event-driven notification both attempt to persist the same contract identifiers on the same local record. The pre-send guard makes this safe for the outbox path (it won't re-invoke the ERP if the event-driven path got there first). But the two paths can race: if the event arrives while the outbox entry is still in-flight, both may attempt to write simultaneously. A unique constraint on the identifier columns prevents duplicate records but can cause the losing write to fail — see the [silent failure cascade case study](../work/silent-failure-cascade.md) for how this race manifested in production.
- **Irreversibility asymmetry is the governing constraint.** The ERP's contract creation is irreversible once committed. Local database writes are fallible. Every error-handling decision in this flow is downstream of that asymmetry: never retry the ERP call after success, never let a local failure trigger a code path that re-invokes the ERP, and accept that a data gap requiring manual repair is strictly preferable to a duplicate billable contract.
- **The pre-send guard is scoped to the contract-creation command type.** Future command types may legitimately need to re-invoke the ERP even when identifiers are present (e.g., an update or cancellation command). The guard's scope is intentionally narrow to avoid blocking those future paths.

### Consequences

> [!consequence-positive] Positive
> ERP-assigned identifiers are now reliably persisted from the synchronous HTTP response, independent of the separate event-driven persistence path. Retried outbox entries can no longer create duplicate ERP contracts once a prior attempt has succeeded and been recorded locally. The pre-send guard short-circuits before ever calling the ERP, so the protection is zero-cost when it fires. The contract-details persistence is isolated in its own error boundary, so a local write failure can never trigger a retry that re-invokes the ERP.

> [!consequence-cost] Accepted costs
> The contract-details persistence failure path logs an error but doesn't trigger retry or dead-lettering — the entry is marked delivered (because the ERP _did_ succeed), and the missing local identifiers require manual reconciliation or the event-driven path to fill the gap. The pre-send guard depends on the local record being resolvable — if the record is deleted while an outbox entry is still pending, the guard can't protect against re-invocation. _(This gap was later made discoverable — see the scope isolation case study — but not prevented.)_

> [!consequence-revisit] Revisit triggers
> If the contract-details persistence failure path fires frequently enough that manual reconciliation becomes operationally burdensome, add a self-healing retry mechanism that retries only the local write (never the ERP call) using the stashed response payload. If the "record doesn't resolve" open question causes a production issue, decide explicitly whether a missing record should block dispatch or proceed. If the single-command-type scope of the pre-send guard becomes a limitation as new command types are added, generalize the guard's scoping logic.
