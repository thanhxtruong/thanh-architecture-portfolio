---
title: "A timeout tells you less than you think."
publish: true
type: article
date: 2026-09-19
description: "Your application stopped waiting. The system on the other side may still have finished the work."
card_summary: "What changes when you treat an expired deadline as uncertainty—and design recovery around it."
category: Distributed systems
article_topic: "Distributed systems / Failure & recovery"
article_label: Article
article_note: "Derived from the production case studies"
featured: true
featured_order: 2
tags: [writing, distributed-systems, failure-recovery]
---

## Separate observation from outcome

A timeout is an observation made by the caller. It tells you a response did not arrive within a deadline. It does not, by itself, tell you whether the remote operation ran, failed, or succeeded.

> [!artifact-note] The design question
> If the first request succeeded, what would happen if we sent it again?

## Choose a recovery action deliberately

For a state-changing operation, recovery may require checking the operation's status, reusing an idempotency key, or reconciling local state with the external system. The available choice depends on the remote API's guarantees.

A longer timeout may reduce uncertainty in normal conditions, but it cannot eliminate lost responses.

## Follow the problem into a real system

The [silent data gap case study](../case-studies/case-study-outbox-persistence-race.md) follows this uncertainty across a request path and an asynchronous notification path. It shows how a missing response becomes a correlation problem.
