/**
 * Availability Schedule Types
 *
 * Google Calendar-style weekly availability with multi-range days,
 * scheduling window constraints, and date-specific overrides.
 */

export interface TimeRange {
  start: string; // "HH:MM" 24-hour format
  end: string;   // "HH:MM" 24-hour format
}

export interface AvailabilitySchedule {
  weeklyHours: Record<string, TimeRange[]>; // "mon" -> [{start, end}, ...]
  timezone: string;                          // IANA timezone
  minNoticeHours: number;                    // 0 = no minimum
  maxAdvanceDays: number;                    // 0 = no limit
  dateOverrides: Record<string, TimeRange[] | null>; // "2026-03-15" -> ranges or null
}

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const DEFAULT_AVAILABILITY_SCHEDULE: AvailabilitySchedule = {
  weeklyHours: {
    mon: [{ start: '09:00', end: '17:00' }],
    tue: [{ start: '09:00', end: '17:00' }],
    wed: [{ start: '09:00', end: '17:00' }],
    thu: [{ start: '09:00', end: '17:00' }],
    fri: [{ start: '09:00', end: '17:00' }],
  },
  timezone: 'America/New_York',
  minNoticeHours: 0,
  maxAdvanceDays: 0,
  dateOverrides: {},
};

/**
 * Convert legacy work_hours + timezone + blackout_dates to AvailabilitySchedule.
 */
export function buildFromLegacy(
  workHours: Record<string, { start: string; end: string } | null> | null,
  timezone: string | null,
  blackoutDates: string[] | null
): AvailabilitySchedule {
  const weeklyHours: Record<string, TimeRange[]> = {};

  if (workHours) {
    for (const [day, range] of Object.entries(workHours)) {
      if (range) {
        weeklyHours[day] = [{ start: range.start, end: range.end }];
      }
    }
  }

  const dateOverrides: Record<string, TimeRange[] | null> = {};
  if (blackoutDates) {
    for (const date of blackoutDates) {
      dateOverrides[date] = null; // null = unavailable
    }
  }

  return {
    weeklyHours,
    timezone: timezone || 'America/New_York',
    minNoticeHours: 0,
    maxAdvanceDays: 0,
    dateOverrides,
  };
}

/**
 * Validate an AvailabilitySchedule. Returns errors (empty = valid).
 */
export function validateSchedule(schedule: AvailabilitySchedule): string[] {
  const errors: string[] = [];
  const timeRegex = /^\d{2}:\d{2}$/;

  for (const [day, ranges] of Object.entries(schedule.weeklyHours)) {
    if (!DAY_KEYS.includes(day as DayKey)) {
      errors.push(`Invalid day key: ${day}`);
      continue;
    }

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (!timeRegex.test(r.start) || !timeRegex.test(r.end)) {
        errors.push(`${day} range ${i + 1}: invalid time format (expected HH:MM)`);
        continue;
      }
      if (r.start >= r.end) {
        errors.push(`${day} range ${i + 1}: start (${r.start}) must be before end (${r.end})`);
      }
    }

    // Check for overlapping ranges within the same day
    const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        errors.push(`${day}: overlapping ranges (${sorted[i - 1].end} > ${sorted[i].start})`);
      }
    }
  }

  // Validate date overrides
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  for (const [date, ranges] of Object.entries(schedule.dateOverrides)) {
    if (!dateRegex.test(date)) {
      errors.push(`Invalid date override key: ${date}`);
      continue;
    }
    if (ranges === null) continue; // null = unavailable, valid
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (!timeRegex.test(r.start) || !timeRegex.test(r.end)) {
        errors.push(`Override ${date} range ${i + 1}: invalid time format`);
      } else if (r.start >= r.end) {
        errors.push(`Override ${date} range ${i + 1}: start must be before end`);
      }
    }
  }

  if (schedule.minNoticeHours < 0) {
    errors.push('minNoticeHours must be >= 0');
  }
  if (schedule.maxAdvanceDays < 0) {
    errors.push('maxAdvanceDays must be >= 0');
  }

  return errors;
}
