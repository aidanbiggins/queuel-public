/**
 * Export Data Types
 *
 * Shared types for the admin CSV export endpoint.
 * Used by both Supabase and memory adapters.
 */

export interface ExportRequestRow {
  id: string;
  status: string;
  createdAt: Date;
}

export interface ExportBookingRow {
  requestId: string;
  bookedAt: Date;
}

export interface ExportInterviewDay {
  date: Date;
}

export interface ExportData {
  requests: ExportRequestRow[];
  bookings: ExportBookingRow[];
  interviewDays: ExportInterviewDay[];
}
