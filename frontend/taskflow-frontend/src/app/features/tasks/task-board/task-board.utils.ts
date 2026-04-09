

export const TASK_STATUSES = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type TaskStatus = keyof typeof TASK_STATUSES;


export const TASK_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f97316',
  LOW: '#22c55e',
  DEFAULT: '#6b7280',
};

// ------ Helper Functions ------

export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? PRIORITY_COLORS['DEFAULT'];
}


export function getSessionUser(): { id: number; email?: string; name?: string } | null {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


export const GLOBAL_ERROR_DISMISS_MS = 4000;
