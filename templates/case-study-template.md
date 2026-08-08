---
title: "<Case study title>"
publish: false
date: YYYY-MM-DD
description: "<one sentence — used as the card preview>"
tags: [case-study]
---

<!-- Opening paragraph: set the scene, explain the system and the problem. -->

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
