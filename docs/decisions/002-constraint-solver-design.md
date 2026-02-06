# ADR 002: Constraint Solver Design

## Status
Accepted

## Context

Interview loops (phone screen + technical rounds + hiring manager) require scheduling 3-5 sessions with different interviewers, all within a candidate's availability, respecting business hours, buffer times, and capacity limits.

This is a constraint satisfaction problem (CSP). We considered:

1. **Brute force enumeration** — Generate all permutations, filter valid ones
2. **SAT/CSP solver library** — Formal solver (e.g., OR-Tools, Z3)
3. **Greedy search with backtracking** — Custom solver tuned for our domain

## Decision

We built a **custom greedy solver with backtracking** in TypeScript, running server-side in the Next.js API layer.

### Why not a formal solver?

- Our constraints are relatively simple (time windows, not arbitrary boolean formulas)
- We need rich diagnostics: *why* a solution is UNSAT, not just "no solution"
- We need to score solutions by preference (load balancing, time-of-day), not just feasibility
- No native TypeScript CSP libraries that handle our specific domain well
- Adding a Python/Rust solver would complicate deployment

### How it works

1. **Slot generation**: For each session in the loop, generate candidate time slots at N-minute granularity (default 15min) within the candidate's availability blocks
2. **Feasibility check**: For each slot, check interviewer free/busy via cached Graph/Google API data
3. **Sequential placement**: Place sessions in order. For each session, try the best-scoring slot. If stuck, backtrack.
4. **Scoring**: Each solution scored by: compactness (prefer single-day), load balance (spread across interviewers), time-of-day preference, capacity headroom
5. **Diagnostics**: When UNSAT, identify the blocking constraints (e.g., "all interviewers in pool busy on Tuesday") and suggest remediation actions

### Configuration

```typescript
interface SchedulingPolicy {
  slotGranularityMinutes: number;     // 15
  maxSolutionsToReturn: number;       // 10
  preferSingleDay: boolean;           // true
  maxDaysSpan: number;                // 3
  enforceBusinessHours: boolean;      // true
  solverTimeoutMs: number;            // 10000
  maxSearchIterations: number;        // 10000
}
```

### Output

```typescript
interface LoopSolveResult {
  status: 'SOLVED' | 'UNSATISFIABLE' | 'PARTIAL' | 'TIMEOUT' | 'ERROR';
  solutions: LoopSolution[];           // Ranked by score
  topConstraints: ConstraintViolation[]; // Why it's hard/impossible
  recommendedActions: RecommendedAction[]; // What to do about it
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

## Consequences

**Good:**
- Fast: typical solve <500ms for 4-session loops
- Rich diagnostics — coordinators understand *why* and get actionable suggestions
- Runs in the same process — no external service dependency
- Easy to tune scoring weights per organization

**Tradeoffs:**
- Won't find globally optimal solutions for very large search spaces
- Custom code to maintain vs. off-the-shelf solver
- Limited to ~10 sessions before performance degrades

**Acceptable because:**
- Interview loops rarely exceed 6 sessions
- "Good enough" solutions with explanations > mathematically optimal without context
- Performance ceiling is well above real-world usage
