---
title: ERP HTTP Client — Result Classification for Retry-Aware Dispatch
publish: true
type: decision
date: 2026-07-16
description: Designing a typed HTTP client whose result type feeds directly into an outbox retry state machine — classifying ERP responses by application-level error code rather than HTTP status, distinguishing transient from permanent failures, and layering per-call resilience beneath application-level retry.
tags: [adr]
status: accepted
decision_id: "ADR-016"
related_project: "[[work/reliable-erp-outbox]]"
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span>2026-07-16</span>
</div>

### Context

The system uses a [transactional outbox](2026-07-13-outbox-retry-backoff-dead-letter.md) to deliver writes to an external ERP system asynchronously. The outbox dispatcher needs a typed HTTP client to make the actual ERP API calls. This client's result type feeds directly into the outbox's retry/backoff/dead-letter state machine — so the client isn't just making HTTP calls, it's producing the classification that determines whether a failed entry gets retried, dead-lettered immediately, or flagged for manual intervention.

The codebase already had an established typed HTTP client for a different external partner API. Several decisions had to be made about where to follow that existing pattern and where to diverge for this use case's specific needs.

### Options considered

#### Result type

> [!option-rejected] Bare boolean or null on failure
> The existing partner API client returned `null` on any failure — adequate for a read-only lookup with no retry machinery behind it. Would have been the right choice if the caller didn't need to distinguish _why_ a call failed, or if all failures warranted the same response (e.g., show an error message and let the user retry manually).

> [!option-chosen] Structured result with four-case outcome
> Return a result object carrying one of four outcomes: `Success`, `SucceededPendingManualIntervention`, `TransientFailure`, `PermanentFailure`. The dispatcher needs this distinction to decide its next move — retry via outbox backoff (transient), dead-letter immediately without burning retry attempts (permanent), or mark delivered but flag for ops visibility (succeeded with caveats). Collapsing transient and permanent into one failure case would force either always-retrying permanently broken payloads through all max-retry attempts, or always-dead-lettering transient blips that would have self-resolved.

#### Classification strategy

> [!option-rejected] Classify by HTTP status code
> Map `2xx` → success, `4xx` → permanent failure, `5xx` → transient failure. The standard approach for well-behaved REST APIs. Would have been the right choice if the ERP returned HTTP status codes that reliably reflected the semantic meaning of the response — i.e., a `400` always meant the request was malformed and would never succeed on retry.

> [!option-chosen] Classify by application-level error code
> The ERP wraps its own application error catalog inside responses whose HTTP status doesn't reliably match the error's meaning — a permanent business-rule rejection can arrive as a `500`, and a retriable internal error can arrive as a `400`. The client parses the application-level error code from the response body regardless of HTTP status, and maps it to the four-case outcome. Unrecognized or unparseable codes default to `TransientFailure` — a deliberately conservative fallback so an unconfirmed code never causes a premature dead-letter. The mapping was initially implemented as a numeric range check on the error code suffix, but code review identified this as fragile (it silently misclassifies any future code the ERP assigns outside the hardcoded range). The classification was refactored to config-driven set membership — three explicit lists of codes (success, needs-intervention, permanent failure) seeded with known defaults and overridable via config without a code change.

#### Error-handling contract

> [!option-rejected] Throw on unexpected responses
> Let exceptions propagate to the caller for unexpected response shapes (empty body, malformed JSON, network errors). Standard .NET behavior — the caller catches what it needs. Would have been the right choice if the caller were application code that could handle exceptions with contextual retry logic of its own.

> [!option-chosen] Never-throws contract
> The client catches all transport and deserialization exceptions internally and maps them to the four-case result. The caller (the outbox dispatcher) should never need to handle exceptions from this client — it only needs to act on the result classification. This contract surfaced a real bug during test-writing: deserializing the response body threw a `JsonException` on empty or malformed bodies rather than returning null. Without the never-throws constraint forcing a test for that case, the exception would have propagated through the dispatcher and bypassed the outbox's own retry classification entirely.

### Decision

Build a typed HTTP client for ERP write delivery with three design properties:

1. **Four-case result classification** feeding the outbox state machine: the dispatcher calls one method and gets back an actionable outcome without inspecting HTTP status codes or parsing ERP error models itself.

2. **Application-level error code classification, config-driven.** Three sets of known error codes (success, needs-intervention, permanent failure) are externalized in config, overridable without redeployment. Any code not in any set defaults to transient failure — the conservative choice that preserves retry attempts rather than prematurely discarding entries.

3. **Never-throws contract.** All transport and deserialization failures are caught internally and mapped to the result type. The dispatcher's only control flow is a switch on the outcome — no exception handling needed at the call site.

Supporting decisions made alongside this:

1. Auth and resilience configuration (managed identity token acquisition, Polly retry/circuit-breaker/timeout) mirrors the existing partner API client's pattern exactly. Resilience coefficients are config-driven but initially copied from the existing client's defaults — they're unproven against this ERP's specific latency and failure characteristics and flagged for tuning once real traffic data exists.
2. The "succeeded pending manual intervention" outcome is surfaced as a distinct case rather than folded into success, so entries that technically completed but require ops follow-up don't silently disappear into the happy path. This applied to two specific ERP response codes where the ERP created the record but flagged it for manual activation.
3. On success, the client captures identifiers returned in the ERP's response payload (account IDs, contract numbers) and carries them in the result object. Persisting those identifiers is deferred to the dispatcher — this client only transports them.

### Consequences

> [!consequence-positive] Positive
> The dispatcher's control flow is a simple switch on four outcomes — no HTTP-status inspection, no error-model parsing, no exception handling at the call site. Classification is config-driven and tunable without redeployment. The never-throws contract forced a real bug to surface during test-writing (malformed body exception) that would otherwise have bypassed the outbox's retry logic silently. Auth and resilience follow the established codebase pattern — a developer familiar with the existing partner client recognizes the shape immediately.

> [!consequence-cost] Accepted costs
> Classification accuracy is bounded by the configured error-code sets — new ERP codes require config updates. Resilience coefficients are unproven against this specific ERP's traffic patterns. Expanding the error model to match the full ERP specification introduced a latent misclassification risk on malformed response bodies.

> [!consequence-revisit] Revisit triggers
> Monitor error-code distribution to catch new ERP codes falling through to the transient-failure default. If the latent deserialization-misclassification risk materializes (a permanent-failure code on a malformed body), consider parsing only the fields the client actually consumes rather than the full error model.
