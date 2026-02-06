/**
 * Interviewer Pool Types
 *
 * Named groups of interviewers that can be assigned to scheduling requests.
 * Pools are org-scoped and support add/remove members idempotently.
 */

// ============================================
// Core Entities
// ============================================

/**
 * InterviewerPool - A named group of interviewers
 */
export interface InterviewerPool {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InterviewerPoolMember - An interviewer belonging to a pool
 */
export interface InterviewerPoolMember {
  id: string;
  poolId: string;
  email: string;
  name: string | null;
  weeklyCap: number | null; // null means no cap
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InterviewerPoolWithMembers - Pool with its member list
 */
export interface InterviewerPoolWithMembers extends InterviewerPool {
  members: InterviewerPoolMember[];
}

// ============================================
// Input Types
// ============================================

export interface CreateInterviewerPoolInput {
  organizationId: string;
  name: string;
  description?: string;
  createdBy: string;
}

export interface UpdateInterviewerPoolInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface AddPoolMemberInput {
  poolId: string;
  email: string;
  name?: string;
  weeklyCap?: number | null;
}

export interface UpdatePoolMemberInput {
  name?: string | null;
  weeklyCap?: number | null;
  active?: boolean;
}

/**
 * Pool with member counts for list views
 */
export interface InterviewerPoolWithMemberCount extends InterviewerPool {
  memberCount: number;
  activeMemberCount: number;
}
