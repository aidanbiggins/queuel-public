# ADR 006: Batch Day Solver Design

## Status
Accepted

## Context

Interview days in "batch" mode need to schedule N candidates across M stations (interview stages) in time-ordered waves. This is a different problem from the loop solver (ADR 002):

- **Loop solver**: Schedule 3-5 sessions for one candidate, respecting interviewer availability and constraints. Run per-candidate.
- **Batch solver**: Schedule all candidates simultaneously across stations, with round-robin interviewer rotation and wave-based time grouping. Run once for the entire day.

The batch problem resembles a bipartite assignment: candidates x (station, round) slots, constrained by interviewer availability, station concurrency limits, and wave capacity.

We considered:

1. **Reuse the loop solver** — Treat each candidate as a mini-loop. Doesn't handle inter-candidate constraints (interviewer can't be in two stations at once).
2. **ILP/CSP solver** — Formal optimization (e.g., OR-Tools). Powerful but adds a heavy dependency and deployment complexity for a server-side JS runtime.
3. **Greedy assignment with rotation** — Custom solver that assigns candidates to waves, then schedules stations in round order with interviewer rotation.

## Decision

Built a **separate greedy solver with wave-based assignment** in TypeScript.

### Algorithm

1. **Wave assignment** — Distribute candidates across waves respecting `maxCandidates` per wave and candidate availability overlap with wave time ranges.
2. **Station scheduling** — For each candidate in each wave, assign stations in `stationOrder`. For each station:
   - Find an available interviewer (round-robin from the station's pool)
   - Check interviewer free/busy via calendar API results
   - Respect `maxConcurrent` per station
   - Compute scheduled start/end based on round number, duration, and buffer
3. **Locked assignments** — Preserve any manually locked assignments from previous solves. Re-solve only unlocked slots.
4. **Scoring** — Score the solution on coverage (% candidates fully assigned), interviewer load balance, idle time between rounds, and back-to-back scheduling density.

### Why separate from the loop solver

The loop solver optimizes for a single candidate across sessions with backtracking search. The batch solver optimizes for many candidates simultaneously with a different constraint structure (station concurrency, wave grouping, interviewer rotation). Combining them would add complexity without shared benefit.

## Consequences

**Positive:**
- Simple, fast solver — handles 20+ candidates x 5 stations in <1s
- Locked assignments enable iterative refinement (solve → review → lock → re-solve)
- Solve runs are audited with input/output snapshots for debugging
- Clean separation from the loop solver — neither impacts the other

**Negative:**
- Greedy approach may not find globally optimal solutions for highly constrained inputs
- No formal optimality guarantee (but UNSAT detection and warnings cover the failure cases)
- Separate codebase to maintain alongside the loop solver

**Mitigations:**
- Warnings surface actionable issues (unassigned candidates, overloaded interviewers)
- Coordinators can manually override via locked assignments
- Grid UI provides visual feedback for reviewing and adjusting the schedule
