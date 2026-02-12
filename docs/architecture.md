# System Architecture

## Overview

Queuel.io is a multi-tenant interview scheduling platform built on Next.js 14 with PostgreSQL (Supabase). The system handles the full lifecycle from scheduling request creation through calendar booking, with optional ATS-triggered automation.

## High-level data flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   iCIMS ATS  │────▶│   Webhooks   │────▶│   Autopilot     │
│  (webhooks)  │     │  (idempotent)│     │  (rule engine)  │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Coordinator  │────▶│  Scheduling  │────▶│  Availability   │
│    (UI)      │     │   Request    │     │    Request      │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  Candidate   │────▶│  Submit avail.  │
                    │  (public UI) │     │  or pick slot   │
                    └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  Constraint  │◀────│  Solver / Slot  │
                    │   Solver     │     │   Generation    │
                    └──────┬───────┘     └─────────────────┘
                           │
                           ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Calendar    │◀────│   Booking    │────▶│  Notifications  │
│ (Graph/GCal) │     │   Engine     │     │   (email/SMS)   │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Reconciliation│
                    │   Engine     │
                    └──────────────┘
```

## Key components

### Scheduling engine

Two modes of operation:

1. **Self-scheduling** — Coordinator creates a request with interviewers. System generates available slots by checking free/busy via Microsoft Graph or Google Calendar. Candidate picks a slot via public link. Calendar event is created automatically.

2. **Availability-first** — Candidate submits availability windows. System intersects with interviewer free/busy to produce ranked suggestions. Coordinator picks the best option (or the solver auto-commits in autopilot mode).

### Constraint solver

Used for multi-session interview loops (e.g., phone screen + 2 technical + hiring manager in one day).

- **Input**: Loop template (sessions with duration, interviewer pools, constraints) + candidate availability blocks + interviewer free/busy
- **Algorithm**: Greedy search with backtracking. Evaluates slots at configurable granularity (default 15min). Scores solutions by compactness, interviewer load balance, time-of-day preference, and capacity headroom.
- **Output**: Ranked solutions with confidence level. When no solution exists (UNSAT), returns blocking constraint violations and recommended actions (e.g., "add more interviewers", "extend availability window").
- **Safety**: Configurable timeout (default 10s), max iteration limit, idempotent solve runs.

### Batch day scheduling

Interview days support two modes:

1. **Classic** — Candidates submit availability, coordinator books them into slots manually with solver-suggested time slots.

2. **Batch** — Station-rotation scheduling for high-volume days (e.g., residency match days, assessment centers). Coordinators define:
   - **Stations** — Interview stages (e.g., "Technical", "Behavioral", "Case Study"), each with assigned interviewers or pools
   - **Waves** — Time-grouped cohorts of candidates starting together
   - **Config** — Duration per round, buffer between rounds, room settings

   The batch solver assigns candidates to station/wave slots:
   - Ensures each candidate visits every required station exactly once
   - Rotates interviewers across rounds to balance load
   - Respects interviewer calendar availability (live free/busy lookups)
   - Supports locked assignments (manual overrides preserved across re-solves)
   - Scores solutions on coverage, load balance, idle time, and back-to-back scheduling
   - Returns warnings for unassigned candidates, overloaded interviewers, or missing pool members

   After solving, coordinators review the grid, lock/unlock assignments, and commit — which creates calendar events for all participants.

### Autopilot (3-phase)

Fully automated scheduling triggered by ATS webhooks:

- **Phase 1**: Webhook received → rule matching → availability request created → candidate notified
- **Phase 2**: Candidate submits availability → solver runs → solutions ranked → coordinator approves (or auto-commit in Phase 3)
- **Phase 3**: Auto-commit for low-risk cases with safety rails:
  - Circuit breakers (org-level, trip after N consecutive failures)
  - Rate limits (per-hour, per-day, per-rule)
  - Minimum availability requirements before auto-commit
  - Escalation to coordinator when automation can't handle it
  - Self-healing when attendees decline or conflicts appear

### Self-healing

When a booked interview loop encounters disruption:

1. **Detection**: Calendar webhook or polling detects attendee declined / event deleted / conflict
2. **Replacement**: System searches the interviewer pool for available replacements
3. **Approval gates**: Time changes require coordinator approval (configurable). Interviewer swaps can auto-approve.
4. **Safety**: Max heals per loop, minimum hours before session, circuit breaker on repeated failures

### Notification pipeline

- Job queue backed by PostgreSQL (`notification_jobs` table)
- Cron worker polls for pending jobs
- Idempotency keys prevent duplicate sends
- Exponential backoff on failures (max 5 attempts)
- Templates: candidate-facing, coordinator-facing, interviewer-facing
- Custom templates per organization (HTML + text)
- Email delivery tracking via Resend webhooks (sent → delivered → opened → clicked → bounced)
- Delivery status surfaced in coordinator UI alongside invite status

### Multi-tenancy

- Every entity scoped to `organization_id`
- Role-based access: admin (full control) and member (limited)
- Feature gating by plan tier (Free / Pro / Enterprise)
- Integration configs (iCIMS, Graph, Google) stored per org

### Reconciliation

Background jobs detect and repair drift between the database and external systems:

- **iCIMS note missing**: Booking exists but iCIMS activity note wasn't written
- **Calendar event missing**: Booking exists but calendar event was deleted externally
- **State mismatch**: Database says booked but calendar says cancelled

Jobs retry with backoff. Unresolvable cases get flagged as `requires_attention`.

## Security model

- **Auth**: NextAuth.js with Google and Microsoft SSO providers
- **Middleware**: Next.js middleware validates session on all routes except public paths (`/book/`, `/availability/`, `/api/public/`, `/api/webhooks/`)
- **Cron**: Bearer token authentication with `CRON_SECRET`
- **Webhooks**: Signature verification (iCIMS HMAC), payload hash deduplication
- **Calendar**: Graph API uses app-only permissions scoped to a single organizer mailbox. Google Calendar uses OAuth with minimal scopes.
- **Public links**: Token + hash verification. Tokens are URL-safe random strings; only hashes are used for lookup.
- **Billing**: Stripe webhook signature verification. Checkout sessions include org metadata for reconciliation.
