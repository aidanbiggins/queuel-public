/**
 * Open Booking Link Types
 *
 * Open booking links are reusable, shareable URLs that let anyone
 * enter their name + email and book time on an interviewer's calendar.
 */

export type InterviewType = 'phone_screen' | 'hm_screen' | 'onsite' | 'final';

export interface OpenBookingLink {
  id: string;
  organizationId: string;
  slug: string;
  title: string;
  description: string | null;
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerPoolId: string | null;
  interviewerEmails: string[];
  organizerEmail: string;
  rollingWindowDays: number;
  maxBookingsPerDay: number | null;
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
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerPoolId?: string | null;
  interviewerEmails?: string[];
  organizerEmail: string;
  rollingWindowDays?: number;
  maxBookingsPerDay?: number | null;
  createdBy: string;
}

export interface UpdateOpenBookingLinkInput {
  title?: string;
  description?: string | null;
  interviewType?: InterviewType;
  durationMinutes?: number;
  interviewerPoolId?: string | null;
  interviewerEmails?: string[];
  rollingWindowDays?: number;
  maxBookingsPerDay?: number | null;
  isActive?: boolean;
}

export interface OpenBookingLinkWithPool extends OpenBookingLink {
  pool?: {
    id: string;
    name: string;
    memberCount: number;
  } | null;
}
