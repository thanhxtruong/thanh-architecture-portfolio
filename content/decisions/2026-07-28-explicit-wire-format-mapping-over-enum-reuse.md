---
title: Explicit Wire-Format Mapping for an Enum, Not Enum Reuse
published: "true"
date: 2026-07-28
description: When a third-party API expected a different string format for an enum value than what our internal type and datastore already used, we mapped explicitly at the outbound serialization boundary rather than changing the enum itself, to avoid breaking existing consumers and stored data.
tags: [adr]
---

<p class="eyebrow">Decision record</p>

<div class="doc-meta">
<span class="status-pill status-superseded"><span class="status-dot"></span>Accepted</span>
<span>2026-07-28</span>
<span class="doc-meta-faint">deciders: me (proposing)</span>
</div>

### Context

While integrating with a third-party partner API, I found that their subscription-creation endpoint requires a `paymentMethodType` field in the request payload. Per that partner's API documentation, the accepted values were human-readable strings with spaces (e.g., `"Credit Card"`, `"Purchase Order"`).

Our internal request model didn't yet expose this field. More importantly, our internal `enum` for payment method type used PascalCase member names with no embedded spaces (e.g., `CreditCard`, `PurchaseOrder`), and those exact string forms were already persisted in our primary datastore. The partner's expected wire format didn't match our internal representation.

In a language like TypeScript, an `enum` member's name and its underlying value can differ trivially:
```csharp
enum PaymentMethodType { CreditCard = "Credit Card" }
```

In C#, this isn't the case — `enum` members are backed by integers, not strings, and any string form only exists if something (reflection, a JSON converter, etc.) is explicitly configured to produce one.

### Options considered

> [!option-rejected] Serialization attribute on the enum
> Use a `JsonStringEnumMemberName` attribute (or custom JSON converter) to control the `enum`'s wire representation directly:
> ```csharp
> public enum PaymentMethodType
> {
>     [JsonStringEnumMemberName("Credit Card")]
>     CreditCard,
>
>     [JsonStringEnumMemberName("Purchase Order")]
>     PurchaseOrder,
> }
> ```
> This is a real capability in modern .NET and would have eliminated the separate mapping function. Rejected because it would couple our internal domain type's serialization behavior to one external partner's arbitrary formatting preference. The same `enum` is serialized in other contexts (to our own frontend client and into our own datastore), so changing its global JSON representation would have broken the existing consumer contract and created an inconsistency with persisted data. Would have been the right choice if the `enum` were new, consumed only in this one outbound context, or if the partner's format happened to match what we'd want everywhere.
 
> [!option-chosen] Explicit mapping at the outbound payload boundary
> A dedicated mapping function in the payload builder translates internal `enum` values to the partner's expected string format. The internal `enum` is untouched — no renamed members, no serialization attributes, no change to how it appears in our datastore or to other consumers. This mirrors a mapping pattern already established elsewhere in the same integration layer for a different lookup table, keeping the codebase consistent. Unmapped values throw rather than silently degrading — if a new `enum` member is added without updating the mapping, the failure is loud and immediate rather than a mysterious rejection from the partner later. `null` input is accepted as a valid non-error state for consistency with an adjacent nullable field (flagged for revisit).

### Decision
 
Map explicitly at the outbound payload boundary; leave the internal `enum` untouched. The wire format one specific external partner wants is not the format our own system should adopt as its source of truth.

Supporting decisions made alongside this:
 
1. Unmapped values throw, not silently degrade. If a new `enum` member is ever added internally without updating the mapping, the mapping function throws rather than sending a `null` or default value to the partner (whose API requires a valid value and would reject the request anyway). This surfaces the gap as a loud failure before any downstream calls or persistence happen, rather than as a mysterious rejection from the partner later.
2. `null` payment method type input is treated as a valid, non-error state, for consistency with an adjacent nullable field already accepted from the upstream caller. I flagged this as worth revisiting.
3. The new field is added as a top-level property on the outbound request model, matching how the partner's schema expects it.
4. Test coverage was extended to cover the `null` case and both known `enum` values explicitly, rather than relying on incidental coverage.
 
### Consequences
 
> [!consequence-positive] Positive
> Internal `enum` values unchanged; all translation to the partner's expected string format lives in one place at the integration boundary. Consistent with established patterns in the integration layer. Test coverage extended to cover the `null` case and both known `enum` values explicitly.
 
> [!consequence-cost] Accepted costs
> Manual mapping maintenance: any new `enum` member requires a corresponding entry. Mitigated by throw-on-unmapped-value behavior, which turns the gap into a loud, immediate failure rather than a silent one.
 
> [!consequence-revisit] Revisit trigger
> The `null` payment method type handling was accepted for consistency with an adjacent nullable field but flagged as worth revisiting — the upstream caller's contract for this field may deserve tightening independently.
