/**
 * Interview Day Types
 *
 * High-volume scheduling mode where coordinators define a day with time blocks,
 * invite multiple candidates, and book them into slots on that day.
 */

// ============================================
// Enums
// ============================================

export type InterviewDayStatus =
  | 'draft'       // Day created but not published
  | 'open'        // Accepting candidate availability
  | 'closed'      // No more submissions, booking in progress
  | 'completed'   // All slots booked or day passed
  | 'cancelled';  // Day cancelled

export type InterviewDayInviteStatus =
  | 'invited'     // Link sent, waiting for candidate
  | 'submitted'   // Candidate submitted availability
  | 'booked'      // Candidate has been scheduled
  | 'declined'    // Candidate declined
  | 'expired';    // Deadline passed without response

// ============================================
// Core Entities
// ============================================

/**
 * InterviewDay - A scheduled interview day with defined time blocks
 */
export interface InterviewDay {
  id: string;
  organizationId: string;

  // Day details
  name: string;
  description: string | null;
  date: string; // ISO date string (YYYY-MM-DD)
  timezone: string;

  // Time blocks for the day (when interviews can be scheduled)
  timeBlocks: InterviewDayTimeBlock[];

  // Interview config
  interviewDurationMinutes: number;
  bufferMinutes: number; // Gap between interviews
  interviewerEmails: string[];

  // Status
  status: InterviewDayStatus;

  // Deadlines
  candidateDeadline: Date; // When candidates must submit availability by

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InterviewDayTimeBlock - A time range within the day when interviews can occur
 */
export interface InterviewDayTimeBlock {
  startTime: string; // HH:mm format (local to day timezone)
  endTime: string;   // HH:mm format (local to day timezone)
}

/**
 * InterviewDayInvite - A candidate invitation to an interview day
 */
export interface InterviewDayInvite {
  id: string;
  interviewDayId: string;

  // Candidate info
  candidateName: string;
  candidateEmail: string;

  // Public link
  publicToken: string;
  publicTokenHash: string;

  // Status
  status: InterviewDayInviteStatus;
  submittedAt: Date | null;
  bookedAt: Date | null;

  // Booking reference (when booked)
  bookingId: string | null;

  // Context
  reqId: string | null;
  reqTitle: string | null;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CandidateEventDayAvailability - Candidate's submitted availability for an interview day
 */
export interface CandidateEventDayAvailability {
  id: string;
  inviteId: string;
  interviewDayId: string;

  // Candidate's available time blocks within the day
  availableBlocks: InterviewDayTimeBlock[];

  // Candidate's timezone for display
  candidateTimezone: string;

  // Audit
  submittedAt: Date;
}

// ============================================
// Input Types
// ============================================

export interface CreateInterviewDayInput {
  organizationId: string;
  name: string;
  description?: string;
  date: string; // YYYY-MM-DD
  timezone: string;
  timeBlocks: InterviewDayTimeBlock[];
  interviewDurationMinutes: number;
  bufferMinutes?: number;
  interviewerEmails: string[];
  candidateDeadline: Date;
  createdBy: string;
}

export interface UpdateInterviewDayInput {
  name?: string;
  description?: string | null;
  date?: string;
  timezone?: string;
  timeBlocks?: InterviewDayTimeBlock[];
  interviewDurationMinutes?: number;
  bufferMinutes?: number;
  interviewerEmails?: string[];
  candidateDeadline?: Date;
  status?: InterviewDayStatus;
}

export interface CreateInterviewDayInviteInput {
  interviewDayId: string;
  candidateName: string;
  candidateEmail: string;
  reqId?: string;
  reqTitle?: string;
}

export interface SubmitEventDayAvailabilityInput {
  inviteId: string;
  interviewDayId: string;
  availableBlocks: InterviewDayTimeBlock[];
  candidateTimezone: string;
}
