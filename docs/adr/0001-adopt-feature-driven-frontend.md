# 0001 Adopt Feature-Driven Frontend

## Status

Accepted

## Context

The frontend needs a stable organizational model that scales across multiple business capabilities without collapsing into route-level sprawl or oversized shared folders.

Without an explicit decision, components, hooks, services, schemas, and types are likely to drift into inconsistent locations, making ownership and review harder over time.

## Decision

The frontend will use a feature-driven structure.

Business-specific logic will be organized under `features/[feature-name]/` and may include:

- components
- hooks
- services
- types
- schemas
- feature-local tests where appropriate

Global folders remain reserved for domain-agnostic primitives and infrastructure.

## Consequences

Benefits:

- clearer ownership boundaries
- lower accidental coupling
- better long-term maintainability
- easier alignment with architecture and agent governance

Costs and tradeoffs:

- some duplication may remain longer before promotion to shared space
- contributors must think about ownership before placing files

## Alternatives Considered

### Route-Centric Organization

Rejected because it tends to mix rendering concerns with broader feature behavior and encourages logic drift into routing layers.

### Broad Shared-First Organization

Rejected because it encourages domain logic to accumulate in generic folders before reuse is proven.
