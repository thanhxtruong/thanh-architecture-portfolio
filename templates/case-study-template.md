---
title: "<Case study title>"
publish: false
type: project
date: YYYY-MM-DD
description: "<one sentence — used as the card preview>"
tags: [case-study]
featured: false
featured_order: 99
focus: "Build & deliver | Investigate & improve | Design & guide"
project_status: "Production | Implemented subsystem | Engineering case"
period: "YYYY"
summary: "<two-sentence project preview>"
my_contribution: "<what you personally investigated, implemented, tested, or guided>"
demonstrates: "<the hiring evidence this case provides>"
facts:
  - value: "<short value>"
    label: "<precise, supportable label>"
evidence:
  - kind: "<Implementation | Test | Investigation | Delivery>"
    title: "<artifact title>"
    summary: "<what it establishes and, when useful, what it does not>"
---

## Quick summary

<!-- Problem, your contribution, and the verified result or current status. -->

## Context and constraints

<!-- Include only the system and business context needed to understand the difficulty. -->

## My contribution

<!-- Distinguish your implementation and influence from the team's work. -->

## Investigation or approach

<!-- Show evidence, alternatives, and the discovery or decision that mattered. -->

## Implementation

<!-- Explain the consequential code-level choices. Use sanitized excerpts or labeled reconstructions. -->

## Validation and delivery

<!-- Tests, rollout, compatibility, operations, and what each form of evidence establishes. -->

## Results and limitations

<!-- State measured or observed outcomes precisely. Preserve unknowns and remaining risks. -->

## Reflection

<!-- What you would repeat, revisit, or change with hindsight. -->

## Scenarios

<!-- Use scenario callouts for each numbered scenario block.
     These render as numbered blocks with a heading, root-cause kicker,
     body prose, and a control callout with a petrol left border. -->

> [!scenario] An inbound event overtakes a queued write
> **Root cause: arrival ordering**
>
> Description of what happens in this scenario.
>
> > [!control] Control — version-guarded writes
> > Description of how this scenario is controlled.

> [!scenario] Two of our own writes race each other
> **Root cause: drain parallelism**
>
> Description of what happens.
>
> > [!control] Control — retire, don't retry
> > Description of how this is controlled.
