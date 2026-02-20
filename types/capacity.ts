/**
 * Capacity Planning Types
 * M15: Scheduling Intelligence & Capacity Planning
 */

import { InterviewType } from './scheduling';
import type { AvailabilitySchedule } from './availabilitySchedule';

// ============================================
// Interviewer Profile Types
// ============================================

export type CalibrationLevel = 'beginner' | 'intermediate' | 'expert';
export type Seniority = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';

export interface InterviewerProfile {
  id: string;
  userId: string | null;
  email: string;
  organizationId: string | null;

  // Personal info
  name: string | null;
  title: string | null;           // "Senior Engineer", "Engineering Manager"
  phone: string | null;
  location: string | null;        // "NYC", "Remote - PST"

  // Training & Calibration
  isTrained: boolean;
  calibrationLevel: CalibrationLevel | null;
  trainedAt: Date | null;
  trainedBy: string | null;

  // Capacity settings
  maxInterviewsPerWeek: number;
  maxInterviewsPerDay: number;
  maxConcurrentPerDay: number;
  bufferMinutes: number;

  // Work schedule
  workHours: Record<string, { start: string; end: string } | null>; // {"mon": {start: "09:00", end: "17:00"}}
  timezone: string;

  // Availability schedule (new: multi-range, overrides, notice)
  availabilitySchedule: AvailabilitySchedule | null;

  // Preferences (legacy - keeping for compatibility)
  preferredTimes: Record<string, string[]>; // {"mon": ["09:00-12:00"], ...}
  blackoutDates: string[]; // ["2026-01-20", ...]
  interviewTypePreferences: InterviewType[];

  // Structured profile fields
  department: string | null;
  manager: string | null;
  seniority: Seniority | null;
  startDate: string | null;       // ISO date (hire/start date)

  // Tags (merged from legacy focusAreas/skillAreas/seniorityLevels)
  tags: string[];

  // Status
  isActive: boolean;
  lastCapacityOverrideAt: Date | null;
  lastCapacityOverrideBy: string | null;

  // Calibration override fields
  priorInterviewCount: number | null;           // Manual entry for imports (pre-system interviews)
  calibrationOverride: CalibrationLevel | null; // Admin override (null = use computed)
  calibrationOverrideAt: Date | null;           // When override was set
  calibrationOverrideBy: string | null;         // Who set the override

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewerProfileInput {
  email: string;
  organizationId?: string;
  userId?: string;

  // Personal info
  name?: string | null;
  title?: string | null;
  phone?: string | null;
  location?: string | null;

  // Training & Calibration
  isTrained?: boolean;
  calibrationLevel?: CalibrationLevel | null;
  trainedAt?: Date | null;
  trainedBy?: string | null;

  // Capacity
  maxInterviewsPerWeek?: number;
  maxInterviewsPerDay?: number;
  maxConcurrentPerDay?: number;
  bufferMinutes?: number;

  // Work schedule
  workHours?: Record<string, { start: string; end: string } | null>;
  timezone?: string;

  // Availability schedule
  availabilitySchedule?: AvailabilitySchedule | null;

  // Preferences
  preferredTimes?: Record<string, string[]>;
  blackoutDates?: string[];
  interviewTypePreferences?: InterviewType[];

  // Structured profile fields
  department?: string | null;
  manager?: string | null;
  seniority?: Seniority | null;
  startDate?: string | null;

  // Tags
  tags?: string[];

  // Calibration override fields
  priorInterviewCount?: number | null;
  calibrationOverride?: CalibrationLevel | null;
  calibrationOverrideAt?: Date | null;
  calibrationOverrideBy?: string | null;

  isActive?: boolean;
}

// ============================================
// Load Rollup Types
// ============================================

export interface InterviewerLoadRollup {
  id: string;
  interviewerProfileId: string;
  organizationId: string;

  // Time window
  weekStart: Date;
  weekEnd: Date;

  // Interview counts
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  rescheduledCount: number;

  // Load metrics
  utilizationPct: number;
  peakDayCount: number;
  avgDailyCount: number;

  // Breakdowns
  byInterviewType: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  byHourOfDay: Record<string, number>;

  // Capacity alerts
  atCapacity: boolean;
  overCapacity: boolean;

  // Computation metadata
  computedAt: Date;
  computationDurationMs: number | null;
}

export interface LoadRollupInput {
  interviewerProfileId: string;
  organizationId: string;
  weekStart: Date;
  weekEnd: Date;
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  rescheduledCount: number;
  utilizationPct: number;
  peakDayCount: number;
  avgDailyCount: number;
  byInterviewType: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  byHourOfDay: Record<string, number>;
  atCapacity: boolean;
  overCapacity: boolean;
  computationDurationMs?: number;
}

// ============================================
// Recommendation Types
// ============================================

export type RecommendationType =
  | 'interviewer_over_capacity'
  | 'interviewer_at_capacity'
  | 'unbalanced_load'
  | 'interviewer_burnout_risk'
  | 'no_availability'
  | 'limited_slots'
  | 'suboptimal_match'
  | 'preferred_time_conflict'
  | 'capacity_alert_org'
  | 'interviewer_inactive';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type RecommendationStatus = 'active' | 'dismissed' | 'acted' | 'expired';

export interface SchedulingRecommendation {
  id: string;
  organizationId: string;
  relatedRequestId: string | null;
  relatedInterviewerId: string | null;

  // Recommendation details
  type: RecommendationType;
  priority: RecommendationPriority;

  // Content
  title: string;
  description: string | null;

  // Action
  actionType: string | null;
  actionPayload: Record<string, unknown> | null;

  // Status
  status: RecommendationStatus;
  dismissedAt: Date | null;
  dismissedBy: string | null;
  actedAt: Date | null;

  // TTL
  expiresAt: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date | null;
}

export interface RecommendationInput {
  organizationId: string;
  relatedRequestId?: string;
  relatedInterviewerId?: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionType?: string;
  actionPayload?: Record<string, unknown>;
  expiresAt?: Date;
}

// ============================================
// Load Calculation Types
// ============================================

export interface LoadCalculationInput {
  interviewerProfileId: string;
  weekStart: Date;
  weekEnd: Date;
}

export interface LoadCalculationResult {
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  rescheduledCount: number;
  utilizationPct: number;
  peakDayCount: number;
  avgDailyCount: number;
  byInterviewType: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  byHourOfDay: Record<string, number>;
  atCapacity: boolean;
  overCapacity: boolean;
}

// ============================================
// Enhanced Scoring Types
// ============================================

export interface InterviewerWithLoad {
  email: string;
  profile: InterviewerProfile | null;
  currentWeekUtilization: number;
  currentWeekScheduled: number;
  atCapacity: boolean;
  overCapacity: boolean;
}

export interface EnhancedSuggestionScore {
  // Existing factors
  availabilityScore: number;
  timelinessScore: number;
  timeOfDayScore: number;

  // New capacity factors
  loadBalanceScore: number;
  capacityHeadroomScore: number;
  preferenceMatchScore: number;

  // Total
  totalScore: number;

  // Rationale components
  rationale: string[];
}

// ============================================
// Capacity Dashboard Types
// ============================================

export interface CapacityOverview {
  organizationId: string;
  weekStart: Date;
  totalInterviewers: number;
  activeInterviewers: number;
  avgUtilization: number;
  atCapacityCount: number;
  overCapacityCount: number;
  totalScheduledThisWeek: number;
}

export interface InterviewerLoadSummary {
  email: string;
  name: string | null;
  thisWeek: {
    scheduled: number;
    capacity: number;
    utilization: number;
    status: 'ok' | 'warning' | 'critical';
  };
  nextWeek: {
    scheduled: number;
    capacity: number;
    utilization: number;
    status: 'ok' | 'warning' | 'critical';
  } | null;
  trend: 'increasing' | 'stable' | 'decreasing';
}
