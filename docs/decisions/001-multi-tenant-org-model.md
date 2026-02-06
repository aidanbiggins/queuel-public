# ADR 001: Multi-Tenant Organization Model

## Status
Accepted

## Context

Queuel.io needs to support multiple companies using the same deployment. Each company has its own interviewers, candidates, calendar integrations, and billing. We needed to decide between:

1. **Database-per-tenant** — Complete isolation, complex ops
2. **Schema-per-tenant** — Good isolation, migration complexity
3. **Row-level multi-tenancy** — Simple ops, requires discipline

## Decision

We chose **row-level multi-tenancy with a shared schema**. Every table that contains tenant-specific data includes an `organization_id` foreign key. All queries filter by organization.

### Organization model

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string | null;
  defaultTimezone: string;
  planTier: 'free' | 'pro' | 'enterprise';
  // Integration configs per org
  // Billing per org
}
```

### Access control

- Every user belongs to one or more organizations via `org_members`
- Roles: `admin` (manage org, integrations, billing) and `member` (schedule interviews)
- Session includes `activeOrgId` — all API routes scope queries to this org
- Middleware validates the session before any data access

### Feature gating

Plan tier determines available features:
- **Free**: Basic scheduling, 3 members, Google Calendar
- **Pro**: Loops, autopilot, solver, templates, analytics, Microsoft + Google
- **Enterprise**: iCIMS integration, SSO/SAML, priority support, unlimited members

## Consequences

**Good:**
- Simple deployment — one database, one app instance
- Easy to add new orgs (just insert a row)
- Shared infrastructure keeps costs low
- Stripe billing maps cleanly to org model

**Tradeoffs:**
- Must be disciplined about `WHERE organization_id = ?` in every query
- A bug in scoping could leak data between orgs
- Large orgs could impact shared database performance

**Mitigations:**
- All database functions accept `organizationId` as a required parameter
- API routes extract org from session — never from request body
- Plan to add RLS (Row Level Security) policies as defense-in-depth
