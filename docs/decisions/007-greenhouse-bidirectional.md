# ADR 006: Greenhouse Bidirectional Integration

## Status
Proposed (Phase 2 — not yet implemented)

## Context
Sprint 4 shipped Greenhouse as a write-only ATS integration. Notes are written to Greenhouse candidate activity feeds when interviews are created, booked, rescheduled, or cancelled. This ADR scopes the future read-side integration.

## Current State (Phase 1 — Shipped)
- `GreenhouseClientReal` implements `AtsClient` (getApplication, addApplicationNote)
- `GreenhouseWritebackService` implements `AtsWritebackService` (all 5 note writeback methods + retry)
- Auth: Greenhouse Harvest API with Basic auth
- Notes are written to candidate-level activity feeds (not application-level)
- Retry queue: `greenhouse_note` sync job type with exponential backoff
- Settings UI: API key configuration, test connection, disconnect

## Phase 2 Scope: Read-Side Integration

### New AtsClient Methods
```typescript
interface AtsClient {
  // Existing
  getApplication(applicationId: string): Promise<AtsApplication>;
  addApplicationNote(applicationId: string, noteText: string): Promise<void>;

  // Phase 2
  listApplications(filters?: { jobId?: string; status?: string }): Promise<AtsApplication[]>;
  getCandidate(candidateId: string): Promise<AtsCandidate>;
  listJobs(): Promise<AtsJob[]>;
}
```

### Webhook Receiver
- New route: `src/app/api/webhooks/greenhouse/route.ts`
- Greenhouse webhooks: `candidate_stage_change`, `application_updated`
- Signature verification: HMAC-SHA256 with webhook secret
- On `candidate_stage_change` to interview stage → create scheduling request automatically

### Candidate Auto-Import
- When a Greenhouse webhook fires for a new candidate reaching interview stage:
  1. Fetch candidate details from Greenhouse API
  2. Create scheduling request with candidate info pre-populated
  3. Send self-schedule link via notification system

### Job Sync
- Periodic sync of Greenhouse jobs to populate `reqTitle` field on scheduling requests
- Eliminates manual entry of requisition information

### Database Changes
- Add `greenhouse_webhook_secret` to organizations
- Add `greenhouse_user_id` for on-behalf-of note attribution
- Add webhook event log table (similar to iCIMS webhook_events)

## Decision
Phase 2 will be triggered by customer demand (design partner requesting candidate import from Greenhouse). The AtsClient interface is designed to be extensible — adding read methods will not break existing write-only consumers.

## Consequences
- Phase 1 (write-only) is self-contained and ships independently
- Phase 2 requires no breaking changes to existing code
- Greenhouse webhook setup requires customer action (configure webhook URL in Greenhouse admin)
