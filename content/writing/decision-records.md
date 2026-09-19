---
title: "A decision record and a system map answer different questions."
publish: true
type: article
date: 2026-05-10
description: "One preserves the reasoning behind a choice. The other helps someone understand the system they have today."
card_summary: "Preserving the reasoning behind a choice while keeping the picture of the system current."
category: Architecture
article_topic: "Architecture / Decision-making"
article_label: Article
article_note: "Adapted from an existing engineering-practice note"
featured: true
featured_order: 1
tags: [writing, architecture, decision-making]
aliases:
  - notes/adrs-are-not-architecture-docs
  - practice/adrs-are-not-architecture-docs
---

## “Why did we choose this?”

A decision record captures the context, alternatives, and consequences of a particular choice. Its value lies in preserving what was known when the choice was made.

If a later decision changes the approach, a new record can explain the change and link back to the earlier one. The reasoning remains available to the next person who asks the same question.

## “How does this work now?”

A system overview has a different responsibility. It should help a reader locate the current boundaries, dependencies, and processing paths. As the implementation changes, the overview needs to change with it.

> [!artifact-note] A useful distinction
> Preserve the history of decisions. Keep the description of the current system current.

## Connect the two

A system map can link a surprising boundary to the record explaining why it exists. A decision record can link to the current overview, so readers can see what the system became.

This gives someone both an accurate starting point and a way to investigate the reasoning behind it.
