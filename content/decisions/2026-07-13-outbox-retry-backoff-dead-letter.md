---
title: Outbox Retry, Backoff, and Dead-Letter State Machine for ERP Write Delivery
publish: true
type: decision
date: 2026-07-13
description: Designing the retry lifecycle for a transactional outbox that delivers writes to an external ERP system — exponential backoff with full jitter, dead-lettering on exhaustion, and idempotency-collision handling — choosing between jitter strategies based on whether a failed attempt is cheap or expensive for the downstream.
tags: [adr]
status: accepted
decision_id: "ADR-013"
related_project: "[[work/reliable-erp-outbox]]"
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span>2026-07-13</span>
</div>

### Context

The system uses a transactional outbox pattern so that writes to an external ERP system (device association, subscription changes, billing updates) aren't issued inline during the user's HTTP request. Instead, the local read-model update and an outbox row are committed in a single database transaction. A background dispatcher polls the outbox for pending rows and delivers them to the ERP independently — giving the user a fast response based only on the local database while the ERP call happens out-of-band with its own retry logic.

The dispatcher's failure-handling path had a gap: on any error from the ERP API, the outbox entry jumped straight to a terminal `Failed` status with no retry cycle. The entry needed a proper lifecycle — retry with backoff while attempts remain, dead-letter when exhausted.

**Two-layer resilience:**
Polly operates at the per-HTTP-call level (milliseconds-to-seconds scope, invisible to the caller) — it absorbs brief transport blips within a single dispatch attempt. The outbox's own retry/backoff/dead-letter state machine operates at the application level (minutes-to-hours scope, spanning separate dispatcher invocations, tracked via attempt count and next-retry timestamps in the database). Both layers are needed together: Polly handles transient network noise; the outbox handles sustained ERP outages. They are architecturally distinct despite both being "retry" — conflating them would either over-retry at the wrong timescale or under-protect at the other.

Separately, the outbox already had an idempotency key with a unique constraint to prevent duplicate rows (the same ERP write submitted twice due to a client retry), but the repository's insert method had no collision handling. A constraint violation would surface as an unhandled exception rather than a benign no-op.

### Options considered

#### Backoff strategy

> [!option-rejected] Equal jitter
> `delay = (base × 2^attempt) / 2 + random(0, (base × 2^attempt) / 2)` — guarantees at least half the exponential delay, then randomizes the upper half. This prevents near-zero retries that could stress the downstream. Would have been the right choice if a failed dispatch attempt were expensive for the ERP — for example, if the ERP accepted the request, opened a database connection, began a multi-table write, and only then failed. In that scenario, each retry consumes real resources on the ERP side, and a guaranteed minimum delay protects a struggling system from being piled on during recovery.

> [!option-rejected] Decorrelated jitter
> `delay = random(base, previous_delay × 3)` — each delay derives from the previous one, creating self-diverging retry trajectories without tracking an attempt counter. Earns its keep when many independent services discover failures at different times with no shared retry state. Would have been the right choice if the retrying components were independent services with no shared coordination, each entering their retry loop at unrelated moments. Here, the outbox is a single shared table polled by one dispatcher mechanism, with attempt counts tracked centrally in the database — the coordination already exists.

> [!option-chosen] Full jitter
> `delay = random(0, base × 2^attempt)` — picks a random value anywhere from zero to the exponential cap, producing the widest possible spread of retries across time. This means some retries land near zero — essentially immediate — which sounds risky but is acceptable here because a failed dispatch attempt is cheap: the ERP call is a single HTTP POST that either succeeds or gets a fast rejection. No resources are held across the attempt — no in-flight payment authorization, no partial upload buffered in memory, no multi-service validation chain. Payment tokenization happens upstream before the outbox entry is even created; the dispatcher only forwards an already-obtained token reference. A near-zero retry that fails fast and cheaply is an acceptable cost, and the wide spread is exactly what's needed: if the ERP degrades, many outbox entries fail in the same window, and full jitter scatters their retries maximally rather than clustering them into a narrower band.

#### Configuration binding

> [!option-rejected] `IOptions<T>` / Options pattern
> Microsoft's standard pattern — register via `services.Configure<T>()`, inject via `IOptions<T>` or `IOptionsMonitor<T>`. Supports live reload and per-request snapshots. Would have been the right choice if the retry coefficients needed to change at runtime without any restart (true hot-reload during an active incident), or if the codebase already used this pattern for similar config. Neither applied — the requirement for "runtime override without a deploy" is satisfied by any externalized config (an app setting changed and restarted), not necessarily hot-reload.

> [!option-chosen] Eager manual binding at startup
> Bind the config section to a plain object once during DI registration via `configuration.GetSection().Get<T>()`. This matches the pattern already established by other feature configs in the same codebase. Fail-fast: a missing or malformed section throws immediately at startup, not lazily on first use. The tradeoff is explicit — no live reload without a restart — and documented as a revisit trigger if operational needs change.

#### Idempotency-collision test strategy

> [!option-rejected] Real relational test database (SQLite in-memory)
> Run the collision test against SQLite so the unique constraint is genuinely enforced by a database engine. Rejected because SQLite throws a different exception type than SQL Server (`SqliteException` error 19 vs. `SqlException` 2601/2627), so the test wouldn't exercise the production code's actual catch path without provider-branching logic. Also introduces a new package dependency and connection-lifecycle boilerplate for one test. Would have been the right choice if no existing test infrastructure for constraint-violation scenarios existed, or if we needed end-to-end proof that the schema migration itself created the constraint correctly.

> [!option-chosen] Fake exception via existing test infrastructure
> Construct a `DbUpdateException` wrapping a `SqlException` with the exact error number (2601/2627) using reflection, thrown by a test-only DbContext subclass that overrides `SaveChangesAsync`. This pattern was already established and proven in the same repository for an identical collision scenario on a different table. Zero new dependencies, directly exercises the exact `SqlException.Number` check used in production. The tradeoff: this doesn't prove the unique index itself exists in the schema — but that's the migration's job to verify, not this unit test's.

### Decision

Implement a retry/backoff/dead-letter state machine in the outbox repository:

- On dispatch failure: increment attempt count, compute next retry delay using full jitter (`random(0, base × 2^attempt)` capped at a configured maximum), record the error, and return the entry to `Pending` for re-polling.
- On exhaustion (attempt count reaches configured max): set status to `Failed` (dead-letter) — no more automatic retries.
- Backoff coefficients (`MaxRetries`, `InitialBackoffSeconds`, `MaxBackoffSeconds`) are externalized in config, not hardcoded, bound eagerly at startup.

Supporting decisions made alongside this:

1. Full jitter chosen over equal and decorrelated jitter, because failed ERP dispatch attempts are cheap (single HTTP call, no held resources, payment authorization already happened upstream) and the realistic failure scenario is a shared ERP outage causing many entries to fail simultaneously — exactly where full jitter's wide spread provides the most protection against retry storms.
2. Idempotency-collision handling on insert: catch `DbUpdateException` wrapping the database-specific unique-constraint error and treat it as a benign no-op, so the original entry continues its dispatch lifecycle undisturbed.
3. Config binding follows the existing eager-manual-binding pattern for consistency with the codebase. Live-reload (`IOptionsMonitor<T>`) is a known tradeoff — flagged for revisit if operational needs require hot-tuning during incidents without restart.

### Consequences

> [!consequence-positive] Positive
> Config-driven tunability without redeployment — ops can adjust retry aggressiveness per environment with a config change and restart. Full jitter scatters retries across the widest possible window, reducing ERP thundering-herd risk during recovery from a shared outage. No new test dependencies — collision testing reuses proven infrastructure from the same codebase. Consistent with existing DI and config conventions.

> [!consequence-cost] Accepted costs
> Full jitter allows occasional near-instant retries (`random(0, cap)` can return values close to zero). Accepted because ERP dispatch failures are cheap — single HTTP call, no held resources. Eager config binding means no live-reload — changing retry coefficients requires a restart. Fake-exception testing doesn't prove the unique index exists in the schema — that verification belongs to the migration layer.

> [!consequence-revisit] Revisit triggers
> Tune resilience coefficients once real ERP latency and failure data is available — the current defaults are borrowed, not derived. If operational experience shows that retry coefficients need hot-tuning during active incidents (not just between restarts), migrate to `IOptionsMonitor<T>`. If the dispatcher's coupling to the API's instance count causes concurrency issues (multiple dispatchers racing on the same rows despite locking), extract to a standalone worker with an explicit single-instance lease. Observability instrumentation (queue depth, dispatch lag, absence-of-work detection) is a separate follow-on.
