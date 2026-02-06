/**
 * Autopilot Types (M20)
 *
 * Types for ATS-triggered scheduling autopilot.
 * When iCIMS reports a candidate is ready to interview,
 * the system automatically creates availability requests.
 */

// ============================================
// Enums
// ============================================

export type AutopilotRunStatus =
  | 'pending'            // Queued for processing (Phase 1)
  | 'processing'         // Currently being processed (Phase 1)
  | 'completed'          // Successfully processed (Phase 1 or final Phase 2)
  | 'failed'             // Failed after retries
  | 'skipped'            // Skipped (no matching rule, rate limit, etc.)
  | 'dry_run'            // Dry run mode - logged but no side effects
  // Phase 2 statuses
  | 'waiting_availability'  // Phase 1 done, waiting for candidate availability
  | 'solving'               // Running constraint solver
  | 'awaiting_approval'     // Solved, waiting for coordinator approval
  | 'committing'            // Committing the chosen solution
  | 'rejected'              // Coordinator rejected the solution
  // Phase 3 statuses
  | 'needs_coordinator'     // Requires human intervention (UNSAT, failures, etc.)
  | 'awaiting_time_change_approval'; // Self-heal pending time change approval

export type AutopilotRunOutcome =
  | 'request_created'           // Availability request created (Phase 1)
  | 'notification_sent'         // Candidate notified
  | 'icims_note_written'        // iCIMS note written
  | 'dry_run'                   // Dry run - no action taken
  | 'skipped_no_rule'           // No matching rule found
  | 'skipped_disabled'          // Autopilot disabled for org
  | 'skipped_rate_limit'        // Rate limit exceeded
  | 'skipped_circuit_open'      // Circuit breaker open
  | 'skipped_duplicate'         // Idempotency key exists
  | 'failed_email'              // Email send failed
  | 'failed_icims'              // iCIMS note failed
  | 'failed_db'                 // Database error
  | 'failed_unknown'            // Unknown error
  // Phase 2 outcomes
  | 'solved'                    // Constraint solver found solutions
  | 'unsat'                     // Constraint solver found no solutions
  | 'solve_timeout'             // Solver timed out
  | 'solve_error'               // Solver error
  | 'approved'                  // Coordinator approved solution
  | 'rejected'                  // Coordinator rejected solution
  | 'booked'                    // Interviews successfully booked
  | 'booking_failed'            // Booking/commit failed
  | 'missing_loop_template'     // No loopTemplateId configured for Phase 2
  // Phase 3 outcomes
  | 'auto_committed'            // Auto-committed without approval
  | 'escalated'                 // Escalated to coordinator
  | 'self_heal_succeeded'       // Self-heal fixed the issue
  | 'self_heal_failed';         // Self-heal could not fix the issue

export type AutopilotActionType = 'availability_request' | 'self_schedule';

// ============================================
// Autopilot Rule
// ============================================

/**
 * Conditions for matching an autopilot rule
 */
export interface AutopilotRuleConditions {
  /** Status values that trigger this rule (OR logic) */
  statusValues: string[];
  /** Match mode: exact or contains */
  matchMode: 'exact' | 'contains';
  /** Optional: Only match specific requisition IDs */
  requisitionIds?: string[] | null;
  /** Optional: Only match requisitions with these tags */
  requisitionTags?: string[] | null;
  /** Optional: Exclude these requisition IDs */
  excludeRequisitionIds?: string[];
}

/**
 * Policy overrides for the constraint solver (Phase 2)
 */
export interface AutopilotPolicyOverrides {
  /** Maximum number of solutions to return */
  maxSolutions?: number;
  /** Prefer single-day loops */
  preferSingleDay?: boolean;
  /** Maximum days the loop can span */
  maxDaysSpan?: number;
  /** Slot granularity in minutes */
  slotGranularityMinutes?: number;
  /** Solver timeout in milliseconds */
  solverTimeoutMs?: number;
}

// ============================================
// Phase 3: Autopilot Mode
// ============================================

/**
 * Organization autopilot mode (Phase 3)
 * - OFF: Autopilot disabled
 * - APPROVE_ONLY: Solve runs, but always requires human approval
 * - AUTO_COMMIT: Can auto-commit low-risk cases without approval
 */
export type AutopilotMode = 'OFF' | 'APPROVE_ONLY' | 'AUTO_COMMIT';

/**
 * Action to take when rule matches
 */
export interface AutopilotRuleAction {
  /** Type of request to create */
  type: AutopilotActionType;
  /** Loop template ID - required for Phase 2 auto-solve */
  loopTemplateId?: string | null;
  /** Days for availability window (default 14) */
  availabilityWindowDays: number;
  /** Days until link expires (default 7) */
  expirationDays: number;
  /** Interview duration in minutes (default 30) */
  durationMinutes: number;
  /** Reminder days after initial send */
  reminderDays?: number[];
  /** Phase 2: Policy overrides for the constraint solver */
  policyOverrides?: AutopilotPolicyOverrides | null;
  /** Phase 2: Whether approval is required before committing (default true) */
  approvalRequired?: boolean;
  // Phase 3 fields
  /** Phase 3: Allow auto-commit without human approval (default false) */
  autoCommitAllowed?: boolean;
  /** Phase 3: Max auto-commits per day for this rule (default 5) */
  maxAutoCommitsPerDay?: number;
  /** Phase 3: Max auto-commits per hour for this rule (default 2) */
  maxAutoCommitsPerHour?: number;
  /** Phase 3: Min candidate availability blocks required for auto-commit (default 5) */
  requireCandidateAvailabilityMinBlocks?: number;
  /** Phase 3: Min total minutes of candidate availability required (default 180) */
  requireCandidateAvailabilityMinTotalMinutes?: number;
  /** Phase 3: Allow time changes during self-heal without approval (default false) */
  allowTimeChangeWithoutApproval?: boolean;
}

/**
 * Autopilot Rule - Database entity
 */
export interface AutopilotRule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  /** Lower priority wins (evaluated first) */
  priority: number;
  enabled: boolean;
  conditions: AutopilotRuleConditions;
  action: AutopilotRuleAction;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

// ============================================
// Autopilot Run
// ============================================

/**
 * Approval status for Phase 2
 */
export type AutopilotApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

/**
 * Autopilot Run - Record of each autopilot execution attempt
 */
export interface AutopilotRun {
  id: string;
  organizationId: string;
  ruleId: string | null;

  // Webhook context
  webhookEventId: string | null;
  applicationId: string;
  candidateEmail: string;
  candidateName: string | null;
  requisitionId: string | null;
  requisitionTitle: string | null;
  triggerStatus: string;

  // Execution state
  status: AutopilotRunStatus;
  outcome: AutopilotRunOutcome | null;

  // Created artifacts (Phase 1)
  availabilityRequestId: string | null;
  requestToken: string | null;
  notificationJobId: string | null;

  // Flags
  dryRun: boolean;

  // Timing
  startedAt: Date | null;
  completedAt: Date | null;

  // Error tracking
  errorMessage: string | null;
  errorStack: string | null;
  retryCount: number;
  maxRetries: number;

  // Idempotency
  idempotencyKey: string;

  // Phase 2: Solve results
  loopSolveRunId: string | null;
  solveIdempotencyKey: string | null;
  solutionsCount: number | null;
  solveResult: AutopilotSolveResultSnapshot | null;

  // Phase 2: Approval
  approvalStatus: AutopilotApprovalStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  chosenSolutionId: string | null;
  rejectionReason: string | null;

  // Phase 2: Booking
  loopBookingId: string | null;
  commitIdempotencyKey: string | null;

  // Phase 2: Availability submission tracking
  availabilitySubmittedAt: Date | null;

  // Phase 3: Auto-commit decision
  autoCommitDecision: ShouldAutoCommitResult | null;

  // Phase 3: Escalation tracking
  escalationSentAt: Date | null;
  escalationSnoozedUntil: Date | null;

  // Phase 3: Self-heal tracking
  lastHealAt: Date | null;
  healCount: number;
  lastHealStatus: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Snapshot of solve result stored in autopilot_runs for quick access
 */
export interface AutopilotSolveResultSnapshot {
  status: 'SOLVED' | 'UNSATISFIABLE' | 'PARTIAL' | 'TIMEOUT' | 'ERROR';
  solutionsCount: number;
  topConstraints?: Array<{
    key: string;
    severity: string;
    description: string;
  }>;
  recommendedActions?: Array<{
    actionType: string;
    description: string;
    priority: number;
  }>;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================
// Autopilot Configuration
// ============================================

/**
 * Organization-level autopilot settings
 */
export interface OrgAutopilotSettings {
  organizationId: string;
  enabled: boolean;
  dryRun: boolean;
  maxDailyRuns: number;
  maxHourlyRuns: number;
  // Phase 3 fields
  /** Phase 3: Autopilot mode (OFF, APPROVE_ONLY, AUTO_COMMIT) */
  autopilotMode: AutopilotMode;
  /** Phase 3: Email for escalation notifications (null = use org admin emails) */
  escalationEmail: string | null;
  /** Phase 3: Whether circuit breaker is enabled for this org (default true) */
  circuitBreakerEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Circuit breaker state for an organization
 */
export interface CircuitBreakerState {
  organizationId: string;
  failureCount: number;
  windowStart: Date;
  status: 'closed' | 'open' | 'half-open';
  lastFailure: Date | null;
  lastSuccess: Date | null;
  updatedAt: Date;
}

// ============================================
// Input Types
// ============================================

export interface CreateAutopilotRuleInput {
  organizationId: string;
  name: string;
  description?: string | null;
  priority?: number;
  enabled?: boolean;
  conditions: AutopilotRuleConditions;
  action: AutopilotRuleAction;
  createdBy?: string | null;
}

export interface CreateAutopilotRunInput {
  organizationId: string;
  ruleId?: string | null;
  webhookEventId?: string | null;
  applicationId: string;
  candidateEmail: string;
  candidateName?: string | null;
  requisitionId?: string | null;
  requisitionTitle?: string | null;
  triggerStatus: string;
  dryRun?: boolean;
  idempotencyKey: string;
}

export interface UpdateAutopilotRunInput {
  status?: AutopilotRunStatus;
  outcome?: AutopilotRunOutcome;
  availabilityRequestId?: string | null;
  requestToken?: string | null;
  notificationJobId?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  retryCount?: number;
  // Phase 2 fields
  loopSolveRunId?: string | null;
  solveIdempotencyKey?: string | null;
  solutionsCount?: number | null;
  solveResult?: AutopilotSolveResultSnapshot | null;
  approvalStatus?: AutopilotApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  chosenSolutionId?: string | null;
  rejectionReason?: string | null;
  loopBookingId?: string | null;
  commitIdempotencyKey?: string | null;
  availabilitySubmittedAt?: Date | null;
  // Phase 3 fields
  autoCommitDecision?: ShouldAutoCommitResult | null;
  escalationSentAt?: Date | null;
  escalationSnoozedUntil?: Date | null;
  lastHealAt?: Date | null;
  healCount?: number;
  lastHealStatus?: string | null;
}

// ============================================
// Audit Actions
// ============================================

export type AutopilotAuditAction =
  | 'autopilot_rule_matched'
  | 'autopilot_request_created'
  | 'autopilot_notification_enqueued'
  | 'autopilot_icims_note_enqueued'
  | 'autopilot_failed'
  | 'autopilot_ignored'
  | 'autopilot_dry_run'
  | 'autopilot_rate_limited'
  | 'autopilot_circuit_open'
  // Phase 2 audit actions
  | 'autopilot_availability_submitted'
  | 'autopilot_solve_started'
  | 'autopilot_solved'
  | 'autopilot_unsat'
  | 'autopilot_solve_error'
  | 'autopilot_approved'
  | 'autopilot_rejected'
  | 'autopilot_commit_started'
  | 'autopilot_booked'
  | 'autopilot_commit_failed'
  // Phase 3 audit actions
  | 'autopilot_autocommit_started'
  | 'autopilot_autocommit_completed'
  | 'autopilot_awaiting_approval'
  | 'autopilot_escalated'
  | 'autopilot_escalation_snoozed'
  | 'autopilot_self_heal_attempted'
  | 'autopilot_self_heal_succeeded'
  | 'autopilot_self_heal_failed';

// ============================================
// API Response Types
// ============================================

export interface AutopilotRunsResponse {
  runs: AutopilotRun[];
  counts: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    dryRun: number;
    pending: number;
  };
}

export interface AutopilotRulesResponse {
  rules: AutopilotRule[];
  total: number;
}

// ============================================
// Phase 3: Auto-Commit Decision Types
// ============================================

/**
 * Reason codes for auto-commit decision
 */
export type AutoCommitReasonCode =
  | 'allowed'
  | 'global_flag_disabled'
  | 'org_mode_not_autocommit'
  | 'rule_autocommit_not_allowed'
  | 'circuit_breaker_open'
  | 'hourly_limit_exceeded'
  | 'daily_limit_exceeded'
  | 'insufficient_availability_blocks'
  | 'insufficient_availability_minutes'
  | 'approval_required_by_rule'
  | 'org_disabled';

/**
 * Input for shouldAutoCommit decision
 */
export interface ShouldAutoCommitInput {
  run: AutopilotRun;
  rule: AutopilotRule | null;
  orgSettings: OrgAutopilotSettings | null;
  availabilityStats: {
    blockCount: number;
    totalMinutes: number;
  };
  circuitBreakerState: CircuitBreakerState | null;
  rateLimits: {
    hourlyAutoCommitCount: number;
    dailyAutoCommitCount: number;
  };
}

/**
 * Result of shouldAutoCommit decision
 */
export interface ShouldAutoCommitResult {
  allowed: boolean;
  reasonCode: AutoCommitReasonCode;
  details: {
    globalFlagEnabled?: boolean;
    orgMode?: AutopilotMode;
    ruleAutoCommitAllowed?: boolean;
    circuitBreakerStatus?: string;
    hourlyCount?: number;
    hourlyLimit?: number;
    dailyCount?: number;
    dailyLimit?: number;
    availabilityBlocks?: number;
    requiredBlocks?: number;
    availabilityMinutes?: number;
    requiredMinutes?: number;
    approvalRequired?: boolean;
  };
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_AUTOPILOT_RULE_ACTION: AutopilotRuleAction = {
  type: 'availability_request',
  loopTemplateId: null,
  availabilityWindowDays: 14,
  expirationDays: 7,
  durationMinutes: 30,
  reminderDays: [3, 7],
  policyOverrides: null,
  approvalRequired: true,
  // Phase 3 defaults
  autoCommitAllowed: false,
  maxAutoCommitsPerDay: 5,
  maxAutoCommitsPerHour: 2,
  requireCandidateAvailabilityMinBlocks: 5,
  requireCandidateAvailabilityMinTotalMinutes: 180,
  allowTimeChangeWithoutApproval: false,
};

export const DEFAULT_AUTOPILOT_RULE_CONDITIONS: AutopilotRuleConditions = {
  statusValues: ['Ready for Interview', 'Interview', 'Interview Requested'],
  matchMode: 'contains',
  requisitionIds: null,
  requisitionTags: null,
  excludeRequisitionIds: [],
};

export const DEFAULT_ORG_AUTOPILOT_SETTINGS: Omit<OrgAutopilotSettings, 'organizationId' | 'createdAt' | 'updatedAt'> = {
  enabled: false,
  dryRun: true,
  maxDailyRuns: 100,
  maxHourlyRuns: 20,
  // Phase 3 defaults
  autopilotMode: 'APPROVE_ONLY',
  escalationEmail: null,
  circuitBreakerEnabled: true,
};
