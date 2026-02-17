export type CalendarSubscriptionScope = 'coordinator' | 'interviewer' | 'both';
export type CalendarSubscriptionDetailLevel = 'minimal' | 'full';
export type CalendarSubscriptionShowAs = 'busy' | 'free';

export interface CalendarSubscription {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  token: string;
  tokenHash: string;
  scope: CalendarSubscriptionScope;
  detailLevel: CalendarSubscriptionDetailLevel;
  showAs: CalendarSubscriptionShowAs;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalendarSubscriptionInput {
  organizationId: string;
  userId: string;
  userEmail: string;
  token: string;
  tokenHash: string;
  scope?: CalendarSubscriptionScope;
  detailLevel?: CalendarSubscriptionDetailLevel;
  showAs?: CalendarSubscriptionShowAs;
}

export interface UpdateCalendarSubscriptionInput {
  scope?: CalendarSubscriptionScope;
  detailLevel?: CalendarSubscriptionDetailLevel;
  showAs?: CalendarSubscriptionShowAs;
}
