/**
 * Billing Types
 *
 * Types for Stripe subscription billing and feature gating.
 */

export type PlanTier = 'free' | 'pro' | 'enterprise';

export type StripeSubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid'
  | 'paused';

export type BillingInterval = 'month' | 'year';

export type GatedFeature =
  | 'loop_autopilot'
  | 'solver'
  | 'templates'
  | 'analytics'
  | 'interview_days'
  | 'custom_email_templates'
  | 'icims_integration'
  | 'priority_support';

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number | null; // null = contact us
  yearlyPrice: number | null;
  features: GatedFeature[];
  maxMembers: number | null; // null = unlimited
  highlighted?: boolean;
}

export interface PlanLimits {
  maxMembers: number | null;
  features: Set<GatedFeature>;
}
