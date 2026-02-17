# Queuel.io

**Interview scheduling automation that actually works.**

Queuel.io eliminates the back-and-forth of coordinating interviews. Candidates pick times, calendars sync, loops auto-schedule, and your team gets hours back every week.

Live at [app.queuel.io](https://app.queuel.io)

---

## What it does

- **Self-scheduling links** — Send candidates a link. They pick a time that works for everyone. Calendar events auto-create with video conferencing.
- **Candidate availability mode** — Candidates submit availability windows. The system suggests optimal slots ranked by interviewer load, time preferences, and capacity.
- **Loop Autopilot** — Define multi-session interview loops (phone screen + technical + hiring manager). A constraint solver schedules the entire loop in one pass, respecting business hours, interviewer capacity, and buffer times.
- **Self-healing** — When an interviewer declines or a conflict appears, the system automatically finds a replacement and reschedules. Approval gates prevent runaway automation.
- **ATS integration** — iCIMS and Greenhouse integrations. Webhooks trigger scheduling automatically when a candidate stage changes. Bidirectional: notes written back to ATS on booking events.
- **Interview Days** — High-volume mode for scheduling many candidates into time blocks on a single day. Supports classic (manual booking) and batch (constraint solver with stations + rotations) modes.
- **Batch Day Scheduling** — Station-rotation scheduling for high-volume interview days. Define stations (interview stages), assign interviewers, and let the solver schedule all candidates across waves automatically.
- **Capacity planning** — Interviewer profiles with weekly caps, load rollups, burnout detection, and org-wide capacity dashboards.

## Architecture highlights

- **Multi-tenant** — Organizations with role-based access (admin/member), feature gating by plan tier
- **Constraint solver** — Greedy search with backtracking over candidate availability x interviewer free/busy. Returns ranked solutions with confidence scores and actionable constraint violations when UNSAT.
- **3-phase autopilot** — Phase 1: webhook → rule matching → availability request. Phase 2: availability submitted → solve → approval. Phase 3: auto-commit with safety rails (circuit breakers, rate limits, escalation).
- **Idempotent everywhere** — Every webhook, notification, booking, and solve run uses idempotency keys. Safe to retry anything.
- **Reconciliation engine** — Background jobs detect and repair drift between calendar state and database state.
- **Notification pipeline** — Job queue with exponential backoff, deduplication, and multi-channel support (email, SMS).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Server Actions |
| Database | PostgreSQL (Supabase) |
| Auth | NextAuth.js (Google, Microsoft SSO) |
| Calendar | Microsoft Graph API, Google Calendar API |
| ATS | iCIMS REST API, Greenhouse Harvest API |
| Email | Resend |
| Billing | Stripe (subscriptions, trials, webhooks) |
| Hosting | Vercel |

## Feature status

| Feature | Status |
|---------|--------|
| Self-scheduling links | Shipped |
| Candidate availability mode | Shipped |
| Booking + rescheduling + cancellation | Shipped |
| Google Calendar integration | Shipped |
| Microsoft Graph integration | Shipped |
| Email notifications (candidate, coordinator, interviewer) | Shipped |
| Escalation + nudge reminders | Shipped |
| Interviewer pools | Shipped |
| Request templates | Shipped |
| Open booking links | Shipped |
| Interview Days | Shipped |
| Batch Day Scheduling (stations + solver) | Shipped |
| Email delivery tracking (Resend webhooks) | Shipped |
| Capacity planning + load balancing | Shipped |
| Calibration rules | Shipped |
| Loop templates + constraint solver | Shipped |
| Loop Autopilot (3-phase) | Shipped |
| Self-healing (auto-replace, reschedule) | Shipped |
| iCIMS webhook integration | Shipped |
| Greenhouse integration (write-back + webhooks) | Shipped |
| Calendar subscriptions (iCal export) | Shipped |
| Stripe billing (Free / Pro / Enterprise) | Shipped |
| Custom email templates | Shipped |
| Analytics dashboard | In progress |

## Repository structure

This is the **public documentation repository**. It contains type definitions, architecture docs, and design decisions. The implementation lives in a private repository.

```
types/           TypeScript interfaces for the entire domain model
docs/
  architecture.md    System architecture overview
  decisions/         Architecture Decision Records (ADRs)
examples/        Sanitized sample data
LICENSE          Elastic License 2.0
```

## Type definitions

The `types/` directory contains the complete TypeScript type system:

- **scheduling.ts** — Core scheduling domain: requests, bookings, availability, notifications, escalation, reconciliation
- **autopilot.ts** — ATS-triggered automation: rules, runs, circuit breakers, auto-commit decisions
- **loop.ts** — Multi-session loops: templates, solver, solutions, bookings, self-healing
- **capacity.ts** — Interviewer profiles, load rollups, recommendations, capacity dashboards
- **organization.ts** — Multi-tenant orgs, members, roles, email templates
- **billing.ts** — Plan tiers, feature gating, Stripe subscription types
- **interviewDay.ts** — High-volume interview day scheduling (classic + batch modes)
- **batchDay.ts** — Batch day stations, waves, solver I/O, assignments, and schedule grid types
- **interviewerPool.ts** — Named interviewer groups with weekly caps
- **calibrationRules.ts** — Title-based and count-based interviewer calibration
- **openBookingLink.ts** — Reusable public booking URLs
- **requestTemplate.ts** — Pre-saved scheduling configurations
- **calendarSubscription.ts** — iCal subscription feeds with scope and detail level controls
- **invite.ts** — Organization invitations with role assignment and expiry
- **export.ts** — Admin CSV export data shapes

## License

[Elastic License 2.0](LICENSE) — You can read, fork, and learn from this code. You cannot use it to build a competing hosted service.
