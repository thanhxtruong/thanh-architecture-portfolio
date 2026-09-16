---
title: "Building a reliable ERP delivery pipeline"
publish: false
type: project
date: 2026-07-30
description: "A transactional outbox, retry-aware HTTP client, concurrent dispatcher, and idempotency guard designed around an irreversible external side effect."
tags: [case-study, outbox, reliability]
aliases:
  - work/reliable-erp-outbox
featured: true
featured_order: 3
focus: "Build & deliver"
project_status: "Implemented subsystem"
period: "2026"
case_theme: "ERP delivery"
case_topics: "Outbox · Concurrency"
card_summary: "A reliable delivery path has to coordinate an atomic business write, retry-aware transport, concurrent claiming, and protection against repeating an irreversible side effect."
inside_case: "the delivery boundary, concurrent-claim integration test, and the retry and idempotency tradeoffs"
at_stake: "reliable delivery without duplicate ERP side effects"
summary: "Built the path from an atomic business write to asynchronous ERP delivery, including retry classification, concurrent claiming, and duplicate-side-effect protection."
my_contribution: "Implemented the dispatcher and unit-of-work seam, shaped the retry and client contracts, and added real-database concurrent-claim verification."
demonstrates: "turning system constraints into maintainable code, tests, and explicit operational tradeoffs"
facts:
  - value: "20"
    label: "rows in concurrent claim verification"
  - value: "2"
    label: "independent repository instances tested"
---

The system needed to deliver business writes to an external ERP without losing a locally committed change or creating the external side effect twice. The ERP call was asynchronous, fallible, and—once it created a billable contract—not safely reversible.

That constraint shaped the complete delivery path: stage an outbox entry in the same transaction as the business write, classify failures before choosing a retry action, claim work safely across multiple application instances, and separate recovery of a local save from repetition of the external call.

## Quick summary

I implemented the background dispatcher and the transaction seam used by its first producer. I also worked through the related retry state machine, typed HTTP-client result contract, claim-locking tradeoff, and pre-send guard. The design was reviewed with the team architect and revised when implementation and testing exposed costs the first proposal had understated.

> [!artifacts] Artifacts in this case study
>
> - [Atomic producer boundary: business write and outbox entry](#artifact-atomic-producer-boundary)
> - [Concurrent-claim integration test: two repositories, same pending set](#artifact-concurrent-claim-integration-test)

## Context and constraints

- The API runs on multiple instances, so more than one dispatcher can poll the same outbox table.
- A producer must commit its business change and outbox entry atomically.
- ERP application error codes do not consistently align with HTTP status categories.
- An ERP contract creation can succeed even when the caller loses the response.
- Retrying a local persistence failure must never repeat a successful external side effect.

## Implementation

The producer executes its business write and outbox insert through an `IUnitOfWork` transaction seam. Once the transaction commits, it signals a `BackgroundService` dispatcher, with scheduled polling as a fallback.

### Artifact: Atomic producer boundary

_Sanitized implementation shape; domain names have been generalized._

```csharp
await unitOfWork.ExecuteAsync(async cancellationToken =>
{
    await subscriptions.SaveAsync(subscription, cancellationToken);
    await outbox.EnqueueAsync(message, cancellationToken);
}, cancellationToken);
```

> [!artifact-note] Reading the artifact
> **Establishes:** The producer expresses the business write and outbox insert inside one transaction boundary, without coupling the application service directly to the ORM context.
>
> **Does not prove:** The excerpt alone does not verify database atomicity, rollback behavior, or that every producer uses the seam correctly.

The dispatcher routes each entry through a typed ERP client. That client returns an actionable classification instead of requiring callers to interpret transport details. Permanent failures dead-letter immediately; transient failures use bounded backoff; successful responses carry the identifiers needed by local persistence.

Each entry is contained independently so an unexpected payload or failed ORM context cannot halt or contaminate the rest of a claimed batch.

## The decision that changed

The first concurrent-claim implementation used a SQL Server skip-locked statement. It was technically appropriate for multiple dispatchers, but it introduced provider-specific raw SQL and could not be meaningfully exercised by the repository’s existing in-memory tests.

After review, the implementation returned to the simpler ORM query under serializable isolation and accepted deadlock retries at the observed load. Later, containerized SQL Server infrastructure closed the real-database testing gap. The decision remains intentionally revisitable if measured dispatch lag shows that contention is material.

## Validation and limits

The real-database integration test runs two independent repository instances against the same 20 eligible rows and verifies that the claimed batches do not overlap. That establishes concurrent claim separation for the modeled scenario. It does not establish sustained-throughput behavior, a deadlock rate under production contention, or the correctness of every ERP failure classification.

### Artifact: Concurrent-claim integration test

_Sanitized excerpt; setup and cleanup are omitted._

```csharp
var claims = await Task.WhenAll(
    repositoryOne.ClaimPendingAsync(batchSize: 10, cancellationToken),
    repositoryTwo.ClaimPendingAsync(batchSize: 10, cancellationToken));

var firstBatchIds = claims[0].Select(entry => entry.Id).ToHashSet();
var secondBatchIds = claims[1].Select(entry => entry.Id).ToHashSet();

Assert.Empty(firstBatchIds.Intersect(secondBatchIds));
Assert.Equal(20, firstBatchIds.Union(secondBatchIds).Count());
```

> [!artifact-note] Reading the artifact
> **Establishes:** Against SQL Server, two independent repository instances can claim the same eligible set concurrently without receiving overlapping rows in this 20-row scenario.
>
> **Does not prove:** It is not a throughput benchmark and does not establish the production deadlock rate, fairness across workers, or behavior under every isolation and failure condition.

The remaining operational questions are explicit: measure queue age and claim failures, reconcile any successful ERP response whose local persistence fails, and revisit the locking strategy when observed contention—not architectural preference—justifies the additional complexity.

## Supporting decisions

- [[2026-07-13-outbox-retry-backoff-dead-letter|Retry, backoff, and dead-letter lifecycle]]
- [[2026-07-16-erp-http-client-result-classification|Retry-aware ERP HTTP result classification]]
- [[2026-07-20-outbox-dispatcher-claim-locking-and-producer-commits|Concurrent claiming and atomic producer commits]]
- [[2026-07-30-erp-contract-persistence-idempotency-guard|Persisting ERP identifiers and preventing duplicate calls]]
