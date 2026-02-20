/**
 * Open Booking Link Types
 *
 * Open booking links are reusable, shareable URLs that let anyone
 * enter their name + email and book time on an interviewer's calendar.
 */

import type { InterviewType } from './scheduling';
import type { AvailabilitySchedule } from './availabilitySchedule';

export interface OpenBookingLink {
  id: string;
  organizationId: string;
  slug: string;
  title: string;
  description: string | null;
  positionTitle: string | null;
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerPoolId: string | null;
  interviewerEmails: string[];
  organizerEmail: string;
  rollingWindowDays: number;
  maxBookingsPerDay: number | null;
  availabilitySchedule: AvailabilitySchedule | null;
  isActive: boolean;
  bookingCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOpenBookingLinkInput {
  organizationId: string;
  slug?: string;
  title: string;
  description?: string;
  positionTitle?: string | null;
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerPoolId?: string | null;
  interviewerEmails?: string[];
  organizerEmail: string;
  rollingWindowDays?: number;
  maxBookingsPerDay?: number | null;
  availabilitySchedule?: AvailabilitySchedule | null;
  createdBy: string;
}

export interface UpdateOpenBookingLinkInput {
  slug?: string;
  title?: string;
  description?: string | null;
  positionTitle?: string | null;
  interviewType?: InterviewType;
  durationMinutes?: number;
  interviewerPoolId?: string | null;
  interviewerEmails?: string[];
  rollingWindowDays?: number;
  maxBookingsPerDay?: number | null;
  availabilitySchedule?: AvailabilitySchedule | null;
  isActive?: boolean;
}

export interface OpenBookingLinkWithPool extends OpenBookingLink {
  pool?: {
    id: string;
    name: string;
    memberCount: number;
  } | null;
}
