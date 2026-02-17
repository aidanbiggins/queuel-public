/**
 * Batch Day Types
 *
 * Constraint-satisfaction batch scheduling: stations (interview types) x candidates,
 * round-robin rotations, solver-generated assignments, waves for grouping.
 */

// ============================================
// Enums
// ============================================

export type BatchDayMode = 'classic' | 'batch';

export type BatchDayAssignmentStatus = 'scheduled' | 'confirmed' | 'cancelled';

export type SolveRunStatus =
  | 'running'
  | 'solved'
  | 'partial'
  | 'unsatisfiable'
  | 'timeout'
  | 'error';

// ============================================
// Core Entities
// ============================================

/**
 * BatchDayStation — An interview type/stage (e.g., "Hiring Manager", "Tech Deep Dive")
 */
export interface BatchDayStation {
  id: string;
  interviewDayId: string;

  name: string;
  focusArea: string | null;
  stationOrder: number;
  durationMinutes: number | null; // overrides parent if set

  // Interviewer source: pool or explicit list
  interviewerPoolId: string | null;
  interviewerEmails: string[];

  isRequired: boolean;
  maxConcurrent: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * BatchDayWave — A group of candidates starting at the same time
 */
export interface BatchDayWave {
  id: string;
  interviewDayId: string;

  name: string;
  waveOrder: number;
  startTime: string; // HH:mm local
  endTime: string;   // HH:mm local
  maxCandidates: number | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * BatchDayAssignment — Solver output: one cell in the schedule grid
 */
export interface BatchDayAssignment {
  id: string;
  interviewDayId: string;
  inviteId: string;
  stationId: string;
  waveId: string | null;
  solveRunId: string | null;

  roundNumber: number;
  interviewerEmail: string;

  scheduledStart: Date;
  scheduledEnd: Date;

  // Calendar integration (populated on commit)
  calendarEventId: string | null;
  conferenceJoinUrl: string | null;

  status: BatchDayAssignmentStatus;
  locked: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * BatchDaySolveRun — Audit trail for a solver execution
 */
export interface BatchDaySolveRun {
  id: string;
  interviewDayId: string;

  status: SolveRunStatus;
  inputsSnapshot: SolverInputSnapshot | null;
  solutionSnapshot: SolverSolutionSnapshot | null;

  candidatesTotal: number;
  candidatesAssigned: number;
  candidatesUnassigned: number;
  solveDurationMs: number | null;
  warnings: SolverWarning[];

  createdAt: Date;
  completedAt: Date | null;
}

/**
 * BatchDayCandidateRoom — Persistent video link for a candidate's entire loop
 */
export interface BatchDayCandidateRoom {
  id: string;
  inviteId: string;
  interviewDayId: string;

  conferenceJoinUrl: string | null;
  calendarEventId: string | null;

  createdAt: Date;
}

// ============================================
// Batch Config (stored as JSONB on interview_days)
// ============================================

export interface BatchDayConfig {
  /** Default duration per station round (minutes) */
  defaultDurationMinutes: number;
  /** Buffer between rounds (minutes) */
  bufferMinutes: number;
  /** Whether to auto-create candidate video rooms */
  candidateRoomsEnabled: boolean;
}

// ============================================
// Solver Types
// ============================================

export interface SolverInputSnapshot {
  stations: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    interviewerEmails: string[];
    isRequired: boolean;
  }>;
  candidates: Array<{
    inviteId: string;
    name: string;
    availableBlocks: Array<{ startTime: string; endTime: string }>;
  }>;
  lockedAssignments: string[]; // assignment IDs
}

export interface SolverSolutionSnapshot {
  assignments: Array<{
    inviteId: string;
    stationId: string;
    roundNumber: number;
    interviewerEmail: string;
    scheduledStart: string;
    scheduledEnd: string;
  }>;
  score: SolverScore;
}

export interface SolverScore {
  total: number;       // 0-100
  coverage: number;    // % candidates fully assigned
  balance: number;     // interviewer load balance score
  idleTime: number;    // penalty for gaps
  backToBack: number;  // bonus/penalty for consecutive interviews
}

export interface SolverWarning {
  type: 'unassigned_candidate' | 'overloaded_interviewer' | 'gap_too_long' | 'missing_pool_members' | 'partial_coverage';
  message: string;
  entityId?: string;   // candidate invite ID or interviewer email
}

/**
 * Full solver input assembled by BatchDayService before calling the solver
 */
export interface SolverInput {
  dayId: string;
  date: string;        // YYYY-MM-DD
  timezone: string;
  defaultDurationMinutes: number;
  bufferMinutes: number;

  stations: SolverStation[];
  candidates: SolverCandidate[];
  lockedAssignments: BatchDayAssignment[];

  // Interviewer calendar availability (free/busy)
  interviewerAvailability: Map<string, InterviewerTimeSlot[]>;
}

export interface SolverStation {
  id: string;
  name: string;
  stationOrder: number;
  durationMinutes: number;
  interviewerEmails: string[];
  isRequired: boolean;
  maxConcurrent: number;
}

export interface SolverCandidate {
  inviteId: string;
  name: string;
  email: string;
  /** UTC time ranges when the candidate is available */
  availableSlots: TimeRange[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface InterviewerTimeSlot {
  start: Date;
  end: Date;
  busy: boolean;
}

/**
 * Output from the solver — ready to be persisted as assignments
 */
export interface SolverOutput {
  status: SolveRunStatus;
  assignments: SolverAssignment[];
  score: SolverScore;
  warnings: SolverWarning[];
  durationMs: number;
}

export interface SolverAssignment {
  inviteId: string;
  stationId: string;
  roundNumber: number;
  interviewerEmail: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}

// ============================================
// Input Types (API / Service)
// ============================================

export interface CreateBatchDayStationInput {
  interviewDayId: string;
  name: string;
  focusArea?: string;
  stationOrder?: number;
  durationMinutes?: number;
  interviewerPoolId?: string;
  interviewerEmails?: string[];
  isRequired?: boolean;
  maxConcurrent?: number;
}

export interface UpdateBatchDayStationInput {
  name?: string;
  focusArea?: string | null;
  stationOrder?: number;
  durationMinutes?: number | null;
  interviewerPoolId?: string | null;
  interviewerEmails?: string[];
  isRequired?: boolean;
  maxConcurrent?: number;
}

export interface CreateBatchDayWaveInput {
  interviewDayId: string;
  name: string;
  waveOrder?: number;
  startTime: string;
  endTime: string;
  maxCandidates?: number;
}

export interface UpdateBatchDayWaveInput {
  name?: string;
  waveOrder?: number;
  startTime?: string;
  endTime?: string;
  maxCandidates?: number | null;
}
