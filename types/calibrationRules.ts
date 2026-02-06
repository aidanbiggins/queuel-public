/**
 * Calibration Rules Types
 *
 * Organization-level rules for computing interviewer calibration levels
 * based on title matching and interview count thresholds.
 */

export type CalibrationLevel = 'beginner' | 'intermediate' | 'expert';

/**
 * Title-based rule for matching interviewer titles to calibration levels.
 * Rules are checked in priority order (highest first).
 */
export interface TitleRule {
  id: string;
  titlePattern: string;        // e.g., "CEO", "VP", "Director" (case-insensitive contains match)
  calibrationLevel: CalibrationLevel;
  priority: number;            // Higher = checked first (CEO before Manager)
}

/**
 * Count-based threshold for assigning calibration levels based on interview count.
 * Used when no title rule matches.
 */
export interface CountThreshold {
  minCount: number;            // Inclusive lower bound
  maxCount: number | null;     // Exclusive upper bound, null = no upper limit
  calibrationLevel: CalibrationLevel;
}

/**
 * Organization-level calibration rules configuration.
 */
export interface CalibrationRules {
  organizationId: string;

  // Title-based rules (checked first, highest priority wins)
  titleRules: TitleRule[];

  // Count-based thresholds (used if no title rule matches)
  countThresholds: CountThreshold[];

  // Default if nothing matches
  defaultLevel: CalibrationLevel;

  updatedAt: Date;
  updatedBy: string;
}

/**
 * Input for creating/updating calibration rules.
 */
export interface CalibrationRulesInput {
  titleRules?: TitleRule[];
  countThresholds?: CountThreshold[];
  defaultLevel?: CalibrationLevel;
  updatedBy: string;
}

/**
 * Default calibration rules used when an organization has no custom rules.
 */
export const DEFAULT_CALIBRATION_RULES: Omit<CalibrationRules, 'organizationId' | 'updatedAt' | 'updatedBy'> = {
  titleRules: [
    { id: '1', titlePattern: 'CEO', calibrationLevel: 'expert', priority: 100 },
    { id: '2', titlePattern: 'CTO', calibrationLevel: 'expert', priority: 100 },
    { id: '3', titlePattern: 'VP', calibrationLevel: 'expert', priority: 90 },
    { id: '4', titlePattern: 'Director', calibrationLevel: 'expert', priority: 80 },
    { id: '5', titlePattern: 'Principal', calibrationLevel: 'expert', priority: 70 },
    { id: '6', titlePattern: 'Staff', calibrationLevel: 'intermediate', priority: 60 },
    { id: '7', titlePattern: 'Senior', calibrationLevel: 'intermediate', priority: 50 },
  ],
  countThresholds: [
    { minCount: 0, maxCount: 10, calibrationLevel: 'beginner' },
    { minCount: 10, maxCount: 30, calibrationLevel: 'intermediate' },
    { minCount: 30, maxCount: null, calibrationLevel: 'expert' },
  ],
  defaultLevel: 'beginner',
};
