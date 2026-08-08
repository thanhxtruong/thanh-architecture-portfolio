---
title: "Thanh — Architecture Portfolio"
publish: true
---

<p class="eyebrow">Portfolio · Software architecture</p>

# Decisions, and the *roads not taken.*

A record of load-bearing decisions I've made and hard problems I've reasoned through in production systems — written to show **how I weigh tradeoffs**, not just what I shipped.

---

<div class="sec-head">
<p class="sec-kicker"><b>01</b> — Decision records</p>

## Decisions

<p class="sec-sub">The load-bearing choices — why each was made, and what was rejected.</p>
</div>

<a class="portfolio-card" href="decisions/use-service-bus-topics-for-telemetry-fanout">
<div class="card-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span class="sep">/</span><span>2026-06-02</span>
<span class="sep">/</span><span class="card-filename">use-service-bus-topics-for-telemetry-fanout.md</span>
</div>
<div class="card-title">Use Service Bus topics for telemetry fan-out</div>
<p class="card-desc">One inbound telemetry stream, three independent consumers each needing the full stream. Topics vs. queues vs. Event Hubs — and why streaming was the right tool for the wrong problem.</p>
</a>

<a class="portfolio-card" href="decisions/row-level-scoping-at-query-layer">
<div class="card-meta">
<span class="status-pill status-accepted"><span class="status-dot"></span>Accepted</span>
<span class="sep">/</span><span>2026-05-19</span>
<span class="sep">/</span><span class="card-filename">row-level-scoping-at-query-layer.md</span>
</div>
<div class="card-title">Enforce row-level data scoping at the query layer</div>
<p class="card-desc">Preventing cross-audience data exposure (IDOR) as a deterministic boundary in the persistence layer, distinct from role checks above it.</p>
</a>

<a class="portfolio-card" href="decisions/poll-erp-on-schedule">
<div class="card-meta">
<span class="status-pill status-superseded"><span class="status-dot"></span>Superseded</span>
<span class="sep">/</span><span>2026-04-30</span>
<span class="sep">/</span><span class="card-filename">poll-erp-on-schedule.md</span>
</div>
<div class="card-title">Poll the ERP on a fixed schedule</div>
<p class="card-desc">An early decision, later superseded by event-driven sync. Kept in the record because the reasoning that turned out wrong is worth preserving.</p>
</a>

---

<div class="sec-head">
<p class="sec-kicker"><b>02</b> — Case studies</p>

## Case studies

<p class="sec-sub">Not "here's a decision" but "here's a problem I reasoned through," end to end.</p>
</div>

<a class="portfolio-card" href="case-studies/stale-writes-erp-sync">
<div class="card-meta">
<span>Distributed systems</span>
<span class="sep">/</span><span>~12 min read</span>
<span class="sep">/</span><span class="card-filename">stale-writes-erp-sync.md</span>
</div>
<div class="card-title">Controlling stale writes in an ERP-to-portal sync</div>
<p class="card-desc">One symptom — a write gets dropped — with three unrelated root causes. Separating them was the whole job.</p>
<ul class="card-scenarios">
<li><b>01</b> An inbound event overtakes a queued write — an ordering problem</li>
<li><b>02</b> Two of our own writes race each other — a parallelism problem</li>
<li><b>03</b> Two users on the same snapshot — a concurrency problem</li>
</ul>
</a>

---

<div class="sec-head">
<p class="sec-kicker"><b>03</b> — On practice</p>

## On practice

<p class="sec-sub">How I document, and why. Supporting evidence — not the headline.</p>
</div>

<a class="portfolio-card" href="practice/adrs-are-not-architecture-docs">
<div class="card-meta">
<span>Practice</span>
<span class="sep">/</span><span class="card-filename">adrs-are-not-architecture-docs.md</span>
</div>
<div class="card-title">ADRs and architecture docs are not the same document</div>
<p class="card-desc">Two artifacts that fail in opposite ways — one immutable and about <em>why</em>, one living and about <em>what</em>. Conflating them undermines both.</p>
</a>
