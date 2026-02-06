/**
 * Request Template Types
 *
 * Templates are pre-saved configurations that reduce scheduling from 6 fields to 2.
 * A template captures: interview type, duration, and interviewer pool/emails.
 * Using a template: user only enters candidate name + email.
 */

export type InterviewType = 'phone_screen' | 'hm_screen' | 'onsite' | 'final';

export interface RequestTemplate {
  id: string;
  organizationId: string;
  name: string; // e.g., "Phone Screen - Backend Pool"
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerPoolId: string | null; // Reference to InterviewerPool
  interviewerEmails: string[]; // Fallback if no pool
  defaultWindowDays: number; // Default scheduling window
  isDefault: boolean; // Show prominently on Hub
  usageCount: number; // Track popularity
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRequestTemplateInput {
  organizationId: string;
  name: string;
  interviewType: InterviewType;
  durationMinutes: number;
  interviewerPoolId?: string | null;
  interviewerEmails?: string[];
  defaultWindowDays?: number;
  isDefault?: boolean;
  createdBy: string;
}

export interface UpdateRequestTemplateInput {
  name?: string;
  interviewType?: InterviewType;
  durationMinutes?: number;
  interviewerPoolId?: string | null;
  interviewerEmails?: string[];
  defaultWindowDays?: number;
  isDefault?: boolean;
}

// For API responses - template with resolved pool data
export interface RequestTemplateWithPool extends RequestTemplate {
  pool?: {
    id: string;
    name: string;
    memberCount: number;
  } | null;
}
