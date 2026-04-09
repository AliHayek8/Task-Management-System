// ============================================================
// Task Board Utilities
// Constants and helper functions used by the TaskBoard component
// ============================================================

// ------ Status Constants ------

/** All possible task status values */
export const TASK_STATUSES = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type TaskStatus = keyof typeof TASK_STATUSES;

// ------ Priority Constants ------

/** All possible task priority values */
export const TASK_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

/** Color mapping for each priority level */
export const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f97316',
  LOW: '#22c55e',
  DEFAULT: '#6b7280',
};

// ------ Helper Functions ------

/**
 * Returns the display color for a given task priority.
 * Falls back to a neutral gray if the priority is unrecognized.
 */
export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? PRIORITY_COLORS['DEFAULT'];
}

/**
 * Retrieves the authenticated user object from session storage.
 * Returns null if no user is stored or the stored value is invalid JSON.
 */
export function getSessionUser(): { id: number; email?: string; name?: string } | null {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Duration (in milliseconds) for how long a global error banner
 * stays visible before being automatically dismissed.
 */
export const GLOBAL_ERROR_DISMISS_MS = 4000;
