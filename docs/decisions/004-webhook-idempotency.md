# ADR 004: Webhook Idempotency

## Status
Accepted

## Context

Queuel.io receives webhooks from iCIMS (ATS) when candidate statuses change. These webhooks trigger the autopilot system to create scheduling requests. Webhooks are inherently unreliable:

- They can be delivered multiple times (at-least-once)
- They can arrive out of order
- The processing side can fail mid-execution
- Network issues cause retries from the sender

A duplicate webhook could create duplicate scheduling requests, send duplicate emails, or book duplicate interviews.

## Decision

We implemented **idempotency at every layer**, not just at the webhook entry point.

### Layer 1: Webhook dedup

Every incoming webhook is stored with:
- `event_id` — The external event ID from iCIMS
- `payload_hash` — SHA-256 of the payload body

Before processing, we check for existing events with the same `event_id` or `payload_hash`. Duplicates are logged and skipped.

```typescript
interface WebhookEvent {
  id: string;
  eventId: string;        // External dedup key
  payloadHash: string;    // Content dedup key
  status: 'received' | 'processing' | 'processed' | 'failed';
  attempts: number;
  maxAttempts: number;
  runAfter: Date;         // For retry scheduling
}
```

### Layer 2: Autopilot run idempotency

Each autopilot run gets an idempotency key derived from:
`queuel-{orgId}-{applicationId}-{triggerStatus}-{datePrefix}`

This means the same candidate + status change + day = one run. If the webhook fires twice for the same status transition, the second creates no new run.

### Layer 3: Notification idempotency

Notifications use keys like:
`queuel-{entityType}-{entityId}-{notificationType}`

The notification worker checks for existing jobs with the same key before creating new ones. This prevents duplicate emails even if the autopilot pipeline processes the same event twice.

### Layer 4: Solve idempotency

The constraint solver accepts an optional `solveIdempotencyKey`. If provided and a solve run with that key already exists, the existing result is returned instead of running the solver again.

### Layer 5: Commit/booking idempotency

Calendar event creation uses a `transactionId` in the Graph API request. If the same booking is committed twice, the second attempt detects the existing event and returns `ALREADY_COMMITTED` instead of creating a duplicate.

### Retry strategy

Failed operations use exponential backoff with jitter:
- Webhooks: 3 attempts, `runAfter` pushed forward each time
- Notifications: 5 attempts
- Sync jobs (iCIMS notes): 5 attempts
- Reconciliation jobs: 3 attempts

## Consequences

**Good:**
- Safe to retry anything at any layer
- No duplicate emails, bookings, or calendar events
- System naturally recovers from transient failures
- Makes debugging easier — every attempt is logged

**Tradeoffs:**
- Idempotency key generation must be deterministic and correct
- Additional database lookups before every operation
- Must handle the "idempotent but different payload" case (same key, updated data)

**Key insight:** Idempotency isn't just about webhooks. In a system with background jobs, cron workers, and retries, *every side-effecting operation* needs an idempotency strategy.
