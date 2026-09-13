---
title: Outbox Dispatcher — Claim Locking Strategy, Atomic Producer Commits, and a Decision Reversed
publish: true
type: decision
date: 2026-07-20
description: Building the background dispatcher that drains a transactional outbox and delivers entries to an external ERP — choosing between skip-locked row claiming and serializable isolation, reversing the decision mid-implementation when the testability cost outweighed the concurrency benefit, and designing a unit-of-work seam so producers can commit atomically without coupling to the ORM.
tags: [adr]
status: accepted
decision_id: "ADR-020"
related_project: "[[work/reliable-erp-outbox]]"
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span>2026-07-20</span>
</div>

### Context

The system's transactional outbox pattern (see [Outbox Retry, Backoff, and Dead-Letter State Machine for ERP Write Delivery](2026-07-13-outbox-retry-backoff-dead-letter.md)) needed two final pieces to become end-to-end functional: a background dispatcher loop that polls the outbox table, claims pending entries, and delivers them to the external ERP via a typed HTTP client; and at least one real producer that inserts an outbox entry inside the same database transaction as its business write, so the full pipeline (user action → outbox insert → dispatch → ERP call) could be exercised.

Several design points surfaced during implementation that the prior planning hadn't settled:

- The API was deployed across **multiple concurrent instances** (confirmed mid-implementation via the cloud portal) — not the single-instance assumption the original claim query was designed for. The claim logic needed to handle concurrent dispatchers polling the same outbox table.
- The producer (the service that commits a user's enrollment) needed to insert an outbox entry and persist its business write in one atomic transaction, but giving that service a direct dependency on the ORM's `DbContext` would have broken its fully-mocked unit test suite, since the in-memory test provider doesn't support real transactions.

### Options considered

#### Claim locking strategy

> [!option-rejected] Skip-locked row claiming (chosen first, then reversed)
> Rewrite the claim query as a single atomic `UPDATE ... WITH (UPDLOCK, ROWLOCK, READPAST) ... OUTPUT INSERTED.*` statement — the SQL Server equivalent of Postgres's `SELECT ... FOR UPDATE SKIP LOCKED`. `UPDLOCK` takes an update lock upfront (avoiding the shared-to-exclusive lock-conversion deadlock that serializable isolation relies on), `ROWLOCK` forces row-level granularity, and `READPAST` lets a concurrent dispatcher skip rows already locked by another claim. Two dispatchers claim disjoint batches with no blocking and no wasted retries.
>
> This was **implemented first** and worked correctly. It was then reversed after review with the architect. The costs: raw SQL traded away the ORM's provider portability and compile-time query safety (the row materialization was column-order-dependent, manually mapping a `SqlDataReader`). More critically, the in-memory test provider can't execute table-hinted raw SQL, so the claim query could only be tested via static string assertions on the SQL text — real concurrent-locking verification was deferred to staging. The team weighed the near-term correctness-under-load benefit against these costs and chose to revert.
>
> Would have been the right choice if the in-memory test provider weren't in use (e.g., if the repo already ran integration tests against a real database engine for all data-access tests), or if observed deadlock frequency justified the added complexity.

> [!option-chosen] Serializable isolation with accepted deadlock risk (reverted to)
> Keep the original ORM-based LINQ query inside a serializable-isolation transaction. Under real multi-instance concurrency, two dispatchers scanning the same eligibility window can hit SQL Server's shared-to-exclusive lock-conversion deadlock — one transaction is killed and retried on the next poll cycle.
>
> This is correct but wasteful under contention: each deadlock-killed claim wastes one poll interval. Accepted because the ORM-based query retains full provider portability, compile-time safety, and complete unit-test coverage via the in-memory provider — costs the team judged higher than occasional deadlock-driven retries at current load.

_(Post-decision update: the deferred concurrent-locking verification gap was later closed. A containerized SQL Server test setup was added to the repo, and an integration test now runs two independent repository instances against a real database, concurrently claiming from the same 20 pending rows, asserting the batches never overlap. Both contexts enable retry-on-failure to mirror production, so a deadlock-losing caller retries automatically. This closed the testability gap that motivated the reversal — but the decision stands, since the simpler ORM query is sufficient at current load.)_

#### Atomic producer commits

> [!option-rejected] Direct DbContext dependency in the producer
> Inject the ORM context directly into the staging service and call `Database.BeginTransactionAsync()` for the atomic business-write + outbox-insert. Rejected because the in-memory test provider throws on `BeginTransactionAsync()` by default, which would have broken the existing fully-mocked test suite for a service that otherwise has no reason to depend on the ORM context. Would have been the right choice to use the direct dependency if the test suite already ran against a real relational provider (where `BeginTransactionAsync()` works), or if the service had other reasons to need ORM-level access beyond transaction wrapping.

> [!option-chosen] Unit-of-work seam
> A new `IUnitOfWork` interface (`Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken ct)`) wraps the ORM's transaction lifecycle. The staging service depends on `IUnitOfWork`, not on the ORM context directly. In tests, `IUnitOfWork` is mocked as a pass-through that simply invokes the delegate — the mocked repositories inside the delegate still run and can be asserted on normally.

### Decision

Build the dispatcher as a `BackgroundService` with the following design properties:

1. **Serializable-isolation claim query**, with the deadlock risk explicitly accepted and documented. Each poll iteration creates its own DI scope (since the `BackgroundService` is a singleton but the repository and ORM context are scoped), claims a batch, and dispatches each entry independently via the command routing table.

2. **One bad entry never stops the loop.** Every exception path — routing failure, the ERP client's classified outcomes, unhandled exceptions from the command invocation — is caught per entry and recorded via the outbox's retry/dead-letter mechanism. The outer loop never throws except on cancellation. This was a deliberate design constraint: a single malformed payload or unexpected ERP client exception must never halt dispatch for every other pending entry.

3. **Permanent failures and unrecognized command types dead-letter immediately** on the first occurrence, skipping the normal attempt-count/backoff cycle. Retrying either case with the same payload can never succeed — exhausting all retry attempts only delays an inevitable dead-letter and wastes ERP calls.

4. **`IUnitOfWork` seam for producers.** The staging service's commit sequence: build the outbox entry payload → `unitOfWork.ExecuteInTransactionAsync(() => { upsert plan; insert outbox entry; })` → signal the dispatcher (only after the transaction commits) → publish domain events. The signal uses a `SemaphoreSlim(0, 1)` so a producer can trigger near-immediate dispatch, with a polling-interval fallback if no signal arrives.

### Consequences

> [!consequence-positive] Positive
> The claim query retains full ORM provider portability, compile-time query safety, and complete unit-test coverage via the in-memory provider. The `IUnitOfWork` seam keeps producer services testable without ORM dependencies. Permanent failures and unknown command types dead-letter immediately rather than wasting retry attempts. The dispatcher's per-entry exception containment ensures one bad entry never blocks the rest of the batch.

> [!consequence-cost] Accepted costs
> Under real multi-instance concurrency, competing serializable-isolation claims can deadlock, killing one transaction per collision. This is expected to occur as routine (not exceptional) behavior and costs one poll interval per occurrence. No deadlock-specific retry handling smooths this over — a deadlocked claim simply fails that cycle. The `IUnitOfWork` seam adds a layer of indirection between the producer and the ORM; future producers should depend on `IUnitOfWork`, not the ORM context directly.

> [!consequence-revisit] Revisit triggers
> If deadlock-driven claim failures are observed to cause measurable dispatch lag (entries waiting longer than one poll interval because consecutive claims deadlock), switch to the skip-locked approach — the containerized integration test now exists to verify concurrent correctness, which was the original blocker. If the absence-of-work detection gap causes a missed incident (dispatcher silently stops polling), add a heartbeat or queue-age alarm.

### Decision reversal note

The locking strategy reversal is documented here because the _process_ of deciding, implementing, reconsidering, and reverting is part of the architectural judgment this ADR records. The skip-locked approach was technically correct and would have been the better choice in a codebase with integration-test infrastructure already in place. The reversal wasn't "we were wrong" — it was "the cost of this improvement, in this codebase at this moment, exceeds the benefit." The containerized test setup that later closed the testability gap means the tradeoff calculation has shifted — but the simpler query remains sufficient at current load, so the decision stands until evidence says otherwise.
