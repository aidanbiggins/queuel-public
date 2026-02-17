/**
 * Scheduling Types for v2
 * Defines all domain models for the interview scheduling system
 */

// ============================================
// Enums
// ============================================

export type InterviewType = 'phone_screen' | 'hm_screen' | 'onsite' | 'final';
export type CalendarProvider = 'microsoft_graph' | 'google_calendar';
export type SchedulingRequestStatus = 'pending' | 'booked' | 'rescheduled' | 'cancelled' | 'expired';
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled';
export type AuditAction =
  | 'link_created'
  | 'slots_viewed'
  | 'booked'
  | 'rescheduled'
  | 'cancelled'
  | 'icims_note'
  | 'icims_note_attempt'
  | 'icims_note_success'
  | 'icims_note_failed'
  | 'greenhouse_note_attempt'
  | 'greenhouse_note_success'
  | 'greenhouse_note_failed'
  | 'sync_job_created'
  | 'sync_job_success'
  | 'sync_job_failed'
  | 'graph_call'
  | 'webhook_received'
  | 'webhook_deduped'
  | 'webhook_processed'
  | 'webhook_failed'
  | 'webhook_candidate_propagated'
  | 'webhook_requisition_propagated'
  | 'reconciliation_detected'
  | 'reconciliation_repaired'
  | 'reconciliation_failed'
  | 'calendar_event_recreated'
  | 'calendar_event_cleanup'
  | 'needs_attention_set'
  | 'org_updated'
  | 'member_role_changed'
  | 'member_removed'
  | 'interview_day_invited'
  | 'interview_day_invite_removed'
  | 'interview_day_booked'
  | 'interviewer_pool_created'
  | 'interviewer_pool_updated'
  | 'interviewer_pool_deleted'
  | 'interviewer_pool_member_added'
  | 'interviewer_pool_member_updated'
  | 'interviewer_pool_member_removed'
  // Autopilot audit actions (M20)
  | 'autopilot_rule_matched'
  | 'autopilot_request_created'
  | 'autopilot_notification_enqueued'
  | 'autopilot_icims_note_enqueued'
  | 'autopilot_failed'
  | 'autopilot_ignored'
  | 'autopilot_dry_run'
  | 'autopilot_rate_limited'
  | 'autopilot_circuit_open'
  // Autopilot Phase 2 audit actions
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
  // Autopilot Phase 3 audit actions
  | 'autopilot_autocommit_started'
  | 'autopilot_autocommit_completed'
  | 'autopilot_autocommit_failed'
  | 'autopilot_awaiting_approval'
  | 'autopilot_escalated'
  | 'autopilot_escalation_snoozed'
  | 'autopilot_self_heal_attempted'
  | 'autopilot_self_heal_succeeded'
  | 'autopilot_self_heal_failed'
  // Request template audit actions (Discoverability)
  | 'request_template_created'
  | 'request_template_updated'
  | 'request_template_deleted'
  // Open booking links audit actions
  | 'open_booking_link_created'
  | 'open_booking_link_updated'
  | 'open_booking_link_deleted'
  // Calibration rules audit actions
  | 'calibration_rules_updated'
  // Calendar sync drift detection
  | 'calendar_drift_detected'
  // Booking transaction safety
  | 'booking_failed_orphaned_events';

export type SyncJobType = 'icims_note' | 'greenhouse_note';
export type SyncJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type WebhookStatus = 'received' | 'processing' | 'processed' | 'failed';
export type WebhookProvider = 'icims' | 'greenhouse';

export type ReconciliationJobType =
  | 'icims_note_missing'
  | 'calendar_event_missing'
  | 'state_mismatch';
export type ReconciliationJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'requires_attention';

// ============================================
// Core Entities
// ============================================

/**
 * TenantIntegrationConfig - Configuration for Graph API access
 */
export interface TenantIntegrationConfig {
  id: string;
  graph: {
    tenantId: string;
    clientId: string;
    clientSecretRef: string; // Reference to secret, not the actual secret
    organizerEmail: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InterviewerIdentity - Maps interviewer emails to Graph user IDs
 */
export interface InterviewerIdentity {
  id: string;
  tenantId: string | null; // Nullable in dev/mock mode
  email: string;
  calendarProviderUserId: string | null; // Graph user id, nullable in dev
  createdAt: Date;
}

/**
 * SchedulingRequest - Coordinator's request to schedule an interview
 */
export interface SchedulingRequest {
  id: string;

  // Organization (multi-tenant)
  organizationId: string | null; // FK to organizations

  // Context (from iCIMS or manual entry)
  applicationId: string | null; // iCIMS application ID
  candidateName: string;
  candidateEmail: string;
  reqId: string | null;
  reqTitle: string;
  interviewType: InterviewType;
  durationMinutes: number;

  // Participants
  interviewerEmails: string[];

  // Pool selection (when using interviewer pools)
  interviewerPoolId: string | null;
  selectionMode: 'pool' | 'specific' | 'pick_one';

  // Calendar linkage (v2)
  organizerEmail: string;
  calendarProvider: CalendarProvider;
  graphTenantId: string | null; // Nullable in dev/mock mode

  // Scheduling window
  windowStart: Date;
  windowEnd: Date;
  candidateTimezone: string;

  // Public link
  publicToken: string; // Raw token for coordinator access
  publicTokenHash: string; // Hash for public URL validation
  expiresAt: Date;

  // Status
  status: SchedulingRequestStatus;

  // Attention flags (M6)
  needsAttention: boolean;
  needsAttentionReason: string | null;

  // Audit
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking - Confirmed interview booking
 */
export interface Booking {
  id: string;
  requestId: string | null;                // FK to scheduling_requests
  availabilityRequestId?: string | null;   // FK to availability_requests (optional)

  // Scheduled time
  scheduledStart: Date;
  scheduledEnd: Date;

  // Calendar event - candidate side
  calendarEventId: string | null;
  calendarIcalUid: string | null;
  conferenceJoinUrl: string | null;

  // Calendar event - interviewer side (split events)
  interviewerCalendarEventId: string | null;
  interviewerCalendarIcalUid: string | null;

  // iCIMS sync (M6)
  icimsActivityId: string | null;

  // Pool selection result
  selectedInterviewerEmail: string | null;

  // Status
  status: BookingStatus;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;

  // Calendar sync
  needsAttention: boolean;
  needsAttentionReason: string | null;
  calendarLastCheckedAt: Date | null;

  // Audit
  bookedBy: string; // 'candidate' or coordinator user id
  bookedAt: Date;
  updatedAt: Date;
}

/**
 * AuditLog - Record of all scheduling actions
 */
export interface AuditLog {
  id: string;
  requestId: string | null;               // FK to scheduling_requests
  availabilityRequestId?: string | null;  // FK to availability_requests (optional)
  bookingId: string | null;

  action: AuditAction;
  actorType: 'coordinator' | 'candidate' | 'system';
  actorId: string | null;

  payload: Record<string, unknown>;
  createdAt: Date;
}

/**
 * WebhookEvent - Incoming webhook from iCIMS (enhanced for M6)
 */
export interface WebhookEvent {
  id: string;
  tenantId: string | null;           // Multi-tenant support
  provider: WebhookProvider;         // Provider identifier
  eventId: string;                   // External event ID for idempotency
  payloadHash: string;               // SHA-256 of payload for dedup
  eventType: string;
  payload: Record<string, unknown>;
  signature: string;
  verified: boolean;
  status: WebhookStatus;             // Processing status
  attempts: number;                  // Processing attempts
  maxAttempts: number;               // Max processing attempts
  lastError: string | null;          // Last error message
  runAfter: Date;                    // For retry scheduling
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SyncJob - Background job for retrying failed external writes
 */
export interface SyncJob {
  id: string;
  type: SyncJobType;
  entityId: string; // e.g., schedulingRequestId or bookingId
  entityType: 'scheduling_request' | 'booking';
  attempts: number;
  maxAttempts: number;
  status: SyncJobStatus;
  lastError: string | null;
  payload: Record<string, unknown>; // Data needed to retry
  runAfter: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ReconciliationJob - Background job for detecting and repairing drift (M6)
 */
export interface ReconciliationJob {
  id: string;
  tenantId: string | null;
  jobType: ReconciliationJobType;
  entityType: 'scheduling_request' | 'booking';
  entityId: string;
  status: ReconciliationJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  detectionReason: string;           // Why was this job created
  runAfter: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Graph API Types
// ============================================

export interface BusyInterval {
  start: Date;
  end: Date;
  status: 'busy' | 'tentative' | 'oof' | 'workingElsewhere';
  isPrivate: boolean;
}

export interface InterviewerAvailability {
  email: string;
  busyIntervals: BusyInterval[];
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
    timeZone: string;
    daysOfWeek: number[]; // 0=Sun, 1=Mon, etc.
  };
  schedule?: import('./availabilitySchedule').AvailabilitySchedule;
}

export interface AvailableSlot {
  slotId: string;
  start: Date;
  end: Date;
  displayStart: string;
  displayEnd: string;
}

export interface CreateEventPayload {
  subject: string;
  body: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: Date;
  end: Date;
  timeZone: string;
  attendees: Array<{
    email: string;
    name: string;
    type: 'required' | 'optional';
  }>;
  isOnlineMeeting: boolean;
  transactionId: string;
}

export interface CreatedEvent {
  eventId: string;
  iCalUId: string | null;
  joinUrl: string | null;
  webLink: string | null;
}

export interface UpdateEventPayload {
  start?: Date;
  end?: Date;
  timeZone?: string;
  subject?: string;
  body?: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
}

// ============================================
// iCIMS Types
// ============================================

export interface IcimsApplication {
  id: string;
  candidateName: string;
  candidateEmail: string;
  requisitionId: string;
  requisitionTitle: string;
  status: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateSchedulingRequestInput {
  organizationId?: string; // FK to organizations (set from session)
  applicationId?: string;
  candidateName: string;
  candidateEmail: string;
  reqId?: string;
  reqTitle: string;
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerEmails: string[];
  interviewerPoolId?: string | null;
  selectionMode?: 'pool' | 'specific' | 'pick_one';
  windowStart: string; // ISO 8601
  windowEnd: string;
  candidateTimezone: string;
}

export interface CreateSchedulingRequestOutput {
  requestId: string;
  publicLink: string;
  expiresAt: string;
}

export interface GetSlotsOutput {
  request: {
    candidateName: string;
    reqTitle: string;
    interviewType: string;
    durationMinutes: number;
  };
  slots: AvailableSlot[];
  timezone: string;
}

export interface BookSlotInput {
  token: string;
  slotId: string;
}

export interface BookSlotOutput {
  success: boolean;
  booking: {
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    conferenceJoinUrl: string | null;
    selectedInterviewerEmail?: string | null;
  };
  message: string;
}

export interface RescheduleInput {
  newStart: string;
  newEnd: string;
  reason?: string;
}

export interface CancelInput {
  reason: string;
  notifyParticipants: boolean;
}

// ============================================
// Availability Request Types (Candidate Provides Availability Mode)
// ============================================

export type AvailabilityRequestStatus =
  | 'pending'      // Link sent, waiting for candidate
  | 'submitted'    // Candidate submitted availability
  | 'booked'       // Coordinator booked from suggestions
  | 'cancelled'    // Request cancelled
  | 'expired';     // Deadline passed

/**
 * AvailabilityRequest - Request for candidate to provide their availability
 * This is the "candidate first" mode where they provide windows, then coordinator matches.
 */
export interface AvailabilityRequest {
  id: string;

  // Organization (multi-tenant)
  organizationId: string | null; // FK to organizations

  // Context (from iCIMS or manual entry)
  applicationId: string | null; // iCIMS application ID
  candidateName: string;
  candidateEmail: string;
  reqId: string | null;
  reqTitle: string;
  interviewType: InterviewType;
  durationMinutes: number;

  // Interviewers to match against
  interviewerEmails: string[];

  // Calendar linkage
  organizerEmail: string;
  calendarProvider: CalendarProvider;
  graphTenantId: string | null;

  // Request window - how far out candidate can provide availability
  windowStart: Date;
  windowEnd: Date;

  // Public link
  publicToken: string;
  publicTokenHash: string;
  expiresAt: Date; // Deadline for candidate to submit

  // Candidate's timezone (set when they submit)
  candidateTimezone: string | null;

  // Status
  status: AvailabilityRequestStatus;

  // Minimum requirements
  minTotalMinutes: number; // Minimum total availability required (default 180 = 3 hours)
  minBlocks: number;       // Minimum number of blocks required (default 5)

  // Audit
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CandidateAvailabilityBlock - A time block when candidate is available
 */
export interface CandidateAvailabilityBlock {
  id: string;
  availabilityRequestId: string;

  // Time range (always in UTC)
  startAt: Date;
  endAt: Date;

  // Metadata
  createdAt: Date;
}

/**
 * AvailabilitySuggestion - A suggested time slot that matches candidate and interviewers
 */
export interface AvailabilitySuggestion {
  startAt: Date;
  endAt: Date;
  interviewerEmails: string[];
  score: number;        // Higher is better
  rationale: string;    // e.g., "All interviewers available, earliest slot"
  /** Enhanced score breakdown (M15 capacity scoring) */
  enhancedScore?: {
    availabilityScore: number;
    timelinessScore: number;
    timeOfDayScore: number;
    loadBalanceScore: number;
    capacityHeadroomScore: number;
    preferenceMatchScore: number;
    totalScore: number;
    rationale: string[];
  };
}

// ============================================
// Availability Request API Types
// ============================================

export interface CreateAvailabilityRequestInput {
  applicationId?: string;
  candidateName: string;
  candidateEmail: string;
  reqId?: string;
  reqTitle: string;
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerEmails: string[];
  windowDays: number;    // How many days out (default 14)
  deadlineDays: number;  // Days until link expires (default 7)
  minTotalMinutes?: number;
  minBlocks?: number;
}

export interface CreateAvailabilityRequestOutput {
  id: string;
  publicLink: string;
  expiresAt: string;
}

export interface SubmitAvailabilityInput {
  candidateTimezone: string;
  blocks: Array<{
    startAt: string; // ISO 8601 UTC
    endAt: string;   // ISO 8601 UTC
  }>;
}

export interface GetSuggestionsOutput {
  suggestions: Array<{
    startAt: string;
    endAt: string;
    interviewerEmails: string[];
    score: number;
    rationale: string;
  }>;
}

export interface BookFromSuggestionInput {
  startAt: string; // ISO 8601 UTC
  candidateTimezone: string;
}

// ============================================
// Notification Types (M10)
// ============================================

export type NotificationType =
  | 'candidate_availability_request'
  | 'candidate_self_schedule_link'
  | 'booking_confirmation'
  | 'reschedule_confirmation'
  | 'cancel_notice'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'nudge_reminder'
  | 'escalation_no_response'
  | 'escalation_expired'
  | 'coordinator_booking'
  | 'coordinator_cancel'
  | 'interviewer_notification'
  | 'interviewer_reminder'
  // Phase 3: Autopilot escalation
  | 'autopilot_escalation'
  // Interview Days
  | 'interview_day_invite'
  | 'batch_day_schedule_confirmation';

export type NotificationStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELED';

export type NotificationEntityType = 'scheduling_request' | 'booking' | 'availability_request' | 'autopilot_run' | 'interview_day_invite';

export interface BatchDayScheduleConfirmationPayload {
  candidateName: string;
  candidateEmail: string;
  interviewDayName: string;
  interviewDayDate: string;
  timezone: string;
  conferenceJoinUrl: string | null;
  scheduleLink: string;
  assignments: Array<{
    stationName: string;
    focusArea: string | null;
    scheduledStart: string;
    scheduledEnd: string;
  }>;
  organizationName?: string;
}

export interface InterviewDayInvitePayload {
  candidateName: string;
  candidateEmail: string;
  interviewDayName: string;
  interviewDayDate: string;       // e.g. "2026-02-16"
  timezone: string;
  durationMinutes: number;
  deadlineUtc: string;            // ISO string
  publicLink: string;
  organizationName?: string;
  isReminder?: boolean;
}

export type NotificationChannel = 'EMAIL' | 'SMS';

export type EmailDeliveryStatus =
  | 'sent'
  | 'delivered'
  | 'delivery_delayed'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained';

/**
 * NotificationJob - A queued notification (email or SMS)
 */
export interface NotificationJob {
  id: string;
  tenantId: string | null;
  channel?: NotificationChannel; // Defaults to 'EMAIL' when absent
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string;
  idempotencyKey: string;
  toEmail: string; // For SMS, this holds the phone number
  payloadJson: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  maxAttempts: number;
  runAfter: Date;
  lastError: string | null;
  sentAt: Date | null;
  deliveryStatus: EmailDeliveryStatus | null;
  deliveryStatusAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NotificationAttempt - Record of each send attempt
 */
export interface NotificationAttempt {
  id: string;
  notificationJobId: string;
  attemptNumber: number;
  status: 'success' | 'failure';
  error: string | null;
  providerMessageId: string | null;
  createdAt: Date;
}

/**
 * Input for creating a notification job
 */
export interface CreateNotificationJobInput {
  tenantId?: string | null;
  channel?: NotificationChannel; // Defaults to 'EMAIL'
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string;
  toEmail: string; // For SMS, this holds the phone number
  payload: Record<string, unknown>;
  runAfter?: Date;
}

/**
 * Template payload types for each notification type
 */
export interface NotificationPayloadBase {
  candidateName: string;
  candidateEmail: string;
  candidateTimezone: string;
  reqTitle: string;
  interviewType: string;
  durationMinutes: number;
  organizationName?: string;
}

export interface AvailabilityRequestPayload extends NotificationPayloadBase {
  publicLink: string;
  expiresAt: string;
  windowStart: string;
  windowEnd: string;
}

export interface SelfScheduleLinkPayload extends NotificationPayloadBase {
  publicLink: string;
  expiresAt: string;
}

export interface BookingConfirmationPayload extends NotificationPayloadBase {
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  scheduledStartLocal: string;
  scheduledEndLocal: string;
  conferenceJoinUrl: string | null;
  interviewerEmails: string[];
  calendarEventId: string | null;
}

export interface RescheduleConfirmationPayload extends NotificationPayloadBase {
  oldStartUtc: string;
  oldEndUtc: string;
  newStartUtc: string;
  newEndUtc: string;
  newStartLocal: string;
  newEndLocal: string;
  conferenceJoinUrl: string | null;
  reason: string | null;
}

export interface CancelNoticePayload extends NotificationPayloadBase {
  reason: string;
  cancelledBy: string;
}

export interface ReminderPayload extends NotificationPayloadBase {
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  scheduledStartLocal: string;
  scheduledEndLocal: string;
  conferenceJoinUrl: string | null;
  hoursUntil: number;
}

// ============================================
// Escalation Types (M16)
// ============================================

/**
 * EscalationConfig - Organization-level escalation timing settings
 */
export interface EscalationConfig {
  id: string;
  organizationId: string;
  initialReminderHours: number;
  secondReminderHours: number;
  escalateToCoordinatorHours: number;
  autoExpireHours: number;
  enableReminders: boolean;
  enableEscalation: boolean;
  enableAutoExpire: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CoordinatorNotificationPreferences - Per-user notification preferences
 */
export interface CoordinatorNotificationPreferences {
  id: string;
  userId: string;
  organizationId: string;
  notifyOnBooking: boolean;
  notifyOnCancel: boolean;
  notifyOnEscalation: boolean;
  digestFrequency: 'immediate' | 'daily' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NudgeReminderPayload - Payload for candidate nudge reminders
 */
export interface NudgeReminderPayload extends NotificationPayloadBase {
  publicLink: string;
  requestType: 'availability' | 'booking';
  daysSinceRequest: number;
  isUrgent: boolean;
}

/**
 * EscalationPayload - Payload for coordinator escalation notifications
 */
export interface EscalationPayload {
  coordinatorEmail: string;
  coordinatorName: string;
  candidateName: string;
  candidateEmail: string;
  reqTitle: string;
  interviewType: string;
  requestId: string;
  requestType: 'availability' | 'booking';
  daysSinceRequest: number;
  publicLink: string;
  organizationName?: string;
}

/**
 * CoordinatorBookingPayload - Payload when candidate books/cancels
 */
export interface CoordinatorBookingPayload {
  coordinatorEmail: string;
  coordinatorName: string;
  candidateName: string;
  candidateEmail: string;
  reqTitle: string;
  interviewType: string;
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  scheduledStartLocal: string;
  scheduledEndLocal: string;
  conferenceJoinUrl: string | null;
  organizationName?: string;
}

/**
 * InterviewerNotificationPayload - Payload for interviewer notifications
 */
export interface InterviewerNotificationPayload {
  interviewerEmail: string;
  interviewerName: string;
  candidateName: string;
  reqTitle: string;
  interviewType: string;
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  scheduledStartLocal: string;
  scheduledEndLocal: string;
  conferenceJoinUrl: string | null;
  organizationName?: string;
}

// ============================================
// Graph Validation Evidence Types (M17)
// ============================================

export type GraphValidationStatus = 'ready' | 'not_ready' | 'not_configured';

/**
 * GraphValidationCheck - Individual validation check result
 */
export interface GraphValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'skip' | 'pending';
  durationMs?: number;
  details?: string[];
  error?: string;
}

/**
 * GraphValidationEvidence - Record of a Graph API validation run
 */
export interface GraphValidationEvidence {
  id: string;
  organizationId: string | null;
  tenantId: string;  // Masked tenant ID for evidence
  runAt: Date;
  overallStatus: GraphValidationStatus;
  checks: GraphValidationCheck[];
  scopingProof: {
    organizerAccessAllowed: boolean;
    nonOrganizerAccessDenied: boolean | null;
    testEmail: string | null;
  };
  runBy: string;  // Email of user who ran the validation
}
