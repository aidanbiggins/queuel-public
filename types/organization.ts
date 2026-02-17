/**
 * Organization Types
 *
 * Types for multi-tenant organization support.
 */

import type { PlanTier, StripeSubscriptionStatus } from './billing';

export type OrgMemberRole = 'admin' | 'member';

/**
 * Organization - A team or company using the scheduling system
 */
export interface Organization {
  id: string;
  name: string;
  slug: string | null;

  // Settings
  defaultTimezone: string;
  defaultDurationMinutes: number;

  // Limits
  maxMembers: number | null;

  // ATS Provider (which ATS is active)
  atsProvider: 'icims' | 'greenhouse' | null;

  // iCIMS Integration
  icimsBaseUrl: string | null;
  icimsApiKey: string | null;
  icimsCustomerId: string | null;
  icimsStatus: 'not_configured' | 'connected' | 'error' | null;
  icimsLastTestedAt: Date | null;

  // Greenhouse Integration
  greenhouseApiKey: string | null;
  greenhouseStatus: 'not_configured' | 'connected' | 'error' | null;
  greenhouseLastTestedAt: Date | null;
  greenhouseWebhookSecret: string | null;

  // Microsoft Graph Calendar
  graphTenantId: string | null;
  graphClientId: string | null;
  graphClientSecret: string | null;
  graphOrganizerEmail: string | null;
  graphStatus: 'not_configured' | 'connected' | 'error' | null;
  graphLastTestedAt: Date | null;

  // Billing
  planTier: PlanTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: StripeSubscriptionStatus | null;
  stripeCurrentPeriodEnd: Date | null;
  billingEmail: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization Member - A user's membership in an organization
 */
export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgMemberRole;

  // Invitation info
  invitedBy: string | null;
  invitedAt: Date | null;
  joinedAt: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's organization membership with org details
 */
export interface UserOrgMembership {
  organization: Organization;
  role: OrgMemberRole;
  joinedAt: Date;
}

/**
 * Organization with member count
 */
export interface OrganizationWithMemberCount extends Organization {
  memberCount: number;
}

/**
 * Create organization input
 */
export interface CreateOrganizationInput {
  name: string;
  slug: string;
  defaultTimezone?: string;
  defaultDurationMinutes?: number;
}

/**
 * Update organization input
 */
export interface UpdateOrganizationInput {
  name?: string;
  slug?: string | null;
  defaultTimezone?: string;
  defaultDurationMinutes?: number;
  maxMembers?: number | null;
  // ATS Provider
  atsProvider?: 'icims' | 'greenhouse' | null;
  // iCIMS Integration
  icimsBaseUrl?: string | null;
  icimsApiKey?: string | null;
  icimsCustomerId?: string | null;
  icimsStatus?: 'not_configured' | 'connected' | 'error' | null;
  icimsLastTestedAt?: Date | null;
  // Greenhouse Integration
  greenhouseApiKey?: string | null;
  greenhouseStatus?: 'not_configured' | 'connected' | 'error' | null;
  greenhouseLastTestedAt?: Date | null;
  greenhouseWebhookSecret?: string | null;
  // Microsoft Graph Calendar
  graphTenantId?: string | null;
  graphClientId?: string | null;
  graphClientSecret?: string | null;
  graphOrganizerEmail?: string | null;
  graphStatus?: 'not_configured' | 'connected' | 'error' | null;
  graphLastTestedAt?: Date | null;
  // Billing
  planTier?: PlanTier;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: StripeSubscriptionStatus | null;
  stripeCurrentPeriodEnd?: Date | null;
  billingEmail?: string | null;
}

/**
 * Email template types that can be customized per organization
 */
export type EmailTemplateType =
  // Organization
  | 'org_invite'
  // Candidate-facing
  | 'candidate_availability_request'
  | 'candidate_self_schedule_link'
  | 'candidate_booking_confirmation'
  | 'candidate_reschedule_confirmation'
  | 'candidate_cancel_notice'
  | 'candidate_reminder'
  | 'candidate_nudge'
  // Coordinator-facing
  | 'coordinator_booking_notification'
  | 'coordinator_cancel_notification'
  | 'coordinator_escalation_no_response'
  | 'coordinator_escalation_expired'
  // Interviewer-facing
  | 'interviewer_notification'
  | 'interviewer_reminder'
  // Interview day
  | 'interview_day_invite'
  | 'interview_day_reminder';

/**
 * Custom email template for an organization
 */
export interface OrgEmailTemplate {
  id: string;
  organizationId: string;
  templateType: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating/updating an email template
 */
export interface UpsertEmailTemplateInput {
  organizationId: string;
  templateType: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isActive?: boolean;
}
