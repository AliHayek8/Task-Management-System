import {
  getPriorityColor,
  getSessionUser,
  TASK_STATUSES,
  PRIORITY_COLORS,
  GLOBAL_ERROR_DISMISS_MS,
} from './task-board.utils';

describe('TASK_STATUSES', () => {
  it('should define TODO status',        () => expect(TASK_STATUSES.TODO).toBe('TODO'));
  it('should define IN_PROGRESS status', () => expect(TASK_STATUSES.IN_PROGRESS).toBe('IN_PROGRESS'));
  it('should define DONE status',        () => expect(TASK_STATUSES.DONE).toBe('DONE'));
});

describe('PRIORITY_COLORS', () => {
  it('should define red for HIGH',     () => expect(PRIORITY_COLORS['HIGH']).toBe('#ef4444'));
  it('should define orange for MEDIUM',() => expect(PRIORITY_COLORS['MEDIUM']).toBe('#f97316'));
  it('should define green for LOW',    () => expect(PRIORITY_COLORS['LOW']).toBe('#22c55e'));
  it('should define a DEFAULT color',  () => expect(PRIORITY_COLORS['DEFAULT']).toBeTruthy());
});

describe('GLOBAL_ERROR_DISMISS_MS', () => {
  it('should be a positive number',         () => expect(GLOBAL_ERROR_DISMISS_MS).toBeGreaterThan(0));
  it('should be at least 1000ms',           () => expect(GLOBAL_ERROR_DISMISS_MS).toBeGreaterThanOrEqual(1000));
});

describe('getPriorityColor()', () => {
  it('should return red for HIGH',        () => expect(getPriorityColor('HIGH')).toBe('#ef4444'));
  it('should return orange for MEDIUM',   () => expect(getPriorityColor('MEDIUM')).toBe('#f97316'));
  it('should return green for LOW',       () => expect(getPriorityColor('LOW')).toBe('#22c55e'));
  it('should return DEFAULT for unknown', () => expect(getPriorityColor('UNKNOWN')).toBe(PRIORITY_COLORS['DEFAULT']));
  it('should return DEFAULT for empty',   () => expect(getPriorityColor('')).toBe(PRIORITY_COLORS['DEFAULT']));
  it('should be case-sensitive',          () => expect(getPriorityColor('high')).toBe(PRIORITY_COLORS['DEFAULT']));
});

describe('getSessionUser()', () => {
  afterEach(() => sessionStorage.clear());

  it('should return null when no "user" key exists', () => {
    sessionStorage.clear();
    expect(getSessionUser()).toBeNull();
  });

  it('should return the parsed user object for valid JSON', () => {
    const user = { id: 5, email: 'alice@example.com', name: 'Alice' };
    sessionStorage.setItem('user', JSON.stringify(user));
    expect(getSessionUser()).toEqual(user);
  });

  it('should return the correct id', () => {
    sessionStorage.setItem('user', JSON.stringify({ id: 42, email: 'bob@co.com' }));
    expect(getSessionUser()?.id).toBe(42);
  });

  it('should return null for invalid JSON', () => {
    sessionStorage.setItem('user', 'not-valid-json{{{');
    expect(getSessionUser()).toBeNull();
  });

  it('should return null for null string', () => {
    sessionStorage.setItem('user', 'null');
    expect(getSessionUser()).toBeNull();
  });
});
