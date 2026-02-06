# ADR 003: Self-Healing Autopilot

## Status
Accepted

## Context

Once an interview loop is booked, things go wrong: interviewers decline, calendars get overbooked, events get deleted. Without automation, a coordinator must manually detect the issue, find a replacement, and update everything. At scale, this is the #1 time sink.

We needed to decide how aggressively to automate recovery.

## Decision

We implemented a **3-tier self-healing system** with configurable automation levels and safety rails.

### Tier 1: Detection

Calendar events are monitored for disruption signals:
- Attendee declined the meeting
- Event was deleted from the calendar
- A conflicting event appeared (double-booking)
- Event was moved to a different time

Each creates a `LoopHealEvent` with the trigger type and evidence.

### Tier 2: Automated resolution

For each heal event, the system attempts:

1. **Interviewer replacement** — Search the pool for another available interviewer in the same slot. If found, update the calendar event and notify.
2. **Session reschedule** — If no replacement available, run the solver for just the affected session within the original time window.

### Tier 3: Approval gates + escalation

Not everything should be automatic:

```typescript
interface LoopHealPolicy {
  allowAutoReplace: boolean;              // Can swap interviewers automatically?
  approvalRequiredForTimeChange: boolean; // Need human OK for reschedule?
  approvalRequiredForInterviewerChange: boolean;
  approvalTimeoutHours: number;           // How long to wait for approval
  minHoursBeforeSession: number;          // Don't touch sessions < N hours away
  maxTotalHealsPerLoop: number;           // Stop after N changes to same loop
  candidateContactPolicy: 'never' | 'only_if_time_changes' | 'always_notify';
}
```

If approval is required, the heal enters `PENDING_APPROVAL` status and the coordinator gets an email. If they don't respond within the timeout, it escalates or expires.

### Safety rails

- **Circuit breaker**: If heal attempts fail repeatedly, stop trying and flag for human attention
- **Max heals per loop**: Prevent infinite heal cycles (default: 5)
- **Minimum lead time**: Don't modify sessions less than 4 hours away
- **Candidate contact policy**: Control when candidates get notified about changes

### Autopilot modes (org-level)

```
OFF            → No automation. Manual scheduling only.
APPROVE_ONLY   → Solver runs, but always needs human approval before booking.
AUTO_COMMIT    → Low-risk cases auto-book. High-risk still need approval.
```

Auto-commit eligibility requires:
- Org in AUTO_COMMIT mode
- Rule allows auto-commit
- Circuit breaker closed
- Under rate limits (hourly + daily)
- Candidate provided sufficient availability (min blocks + min minutes)

## Consequences

**Good:**
- Coordinators save hours per week on disruption recovery
- Configurable per org — conservative teams use APPROVE_ONLY, mature teams use AUTO_COMMIT
- Circuit breakers prevent runaway automation
- Full audit trail of every heal attempt and decision

**Tradeoffs:**
- Complexity: heal detection + resolution + approval + escalation is a lot of state machine
- Calendar API reliability: if Graph/Google is down, heals queue up
- Edge cases: what if the replacement interviewer also declines? (Answer: counts toward maxTotalHealsPerLoop)

**Key design principle:** Every automated action must be reversible or require approval. The system should never surprise a candidate with a time change they didn't agree to.
