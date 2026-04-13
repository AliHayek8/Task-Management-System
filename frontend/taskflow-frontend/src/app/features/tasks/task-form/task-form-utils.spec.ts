import {
  validateTitle, validateDescription, validateAssigneeEmail,
  validateDeadline, validateTaskForm, isFormErrorFree,
  getEmptyFieldErrors, TITLE_MIN_LENGTH, DESCRIPTION_MIN_LENGTH, VALIDATION_MESSAGES,
} from './task-form.utils';
import { Task } from '../../../core/services/task/task.service';

function buildTask(overrides: Partial<Task> = {}): Task {
  return { title: 'Fix Bug', description: '', status: 'TODO', priority: 'MEDIUM', projectId: 1, ...overrides };
}
function tomorrow(): string { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }
function yesterday(): string { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; }

// ── validateTitle() ───────────────────────────────────────────────────────────

describe('validateTitle()', () => {
  it('should return required error for empty string',           () => expect(validateTitle('')).toBe(VALIDATION_MESSAGES.title.required));
  it('should return required error for whitespace-only',        () => expect(validateTitle('   ')).toBe(VALIDATION_MESSAGES.title.required));
  it('should return minLength error when title too short',      () => expect(validateTitle('AB')).toBe(VALIDATION_MESSAGES.title.minLength));
  it('should return empty for title exactly at min length',     () => expect(validateTitle('A'.repeat(TITLE_MIN_LENGTH))).toBe(''));
  it('should return empty for a valid longer title',            () => expect(validateTitle('Fix critical bug')).toBe(''));
  it('should trim before length check',                         () => expect(validateTitle('  A  ')).toBe(VALIDATION_MESSAGES.title.minLength));
});

// ── validateDescription() ─────────────────────────────────────────────────────

describe('validateDescription()', () => {
  it('should return empty for empty description (optional)',    () => expect(validateDescription('')).toBe(''));
  it('should return empty for undefined description',           () => expect(validateDescription(undefined)).toBe(''));
  it('should return minLength error when too short',            () => expect(validateDescription('Too short')).toBe(VALIDATION_MESSAGES.description.minLength));
  it('should return empty at exactly min length',               () => expect(validateDescription('A'.repeat(DESCRIPTION_MIN_LENGTH))).toBe(''));
  it('should return empty for a long description',              () => expect(validateDescription('A proper description with enough characters to pass validation check.')).toBe(''));
  it('should treat whitespace-only as empty (no error)',        () => expect(validateDescription('   ')).toBe(''));
});

// ── validateAssigneeEmail() ───────────────────────────────────────────────────

describe('validateAssigneeEmail()', () => {
  it('should return empty for empty email (optional)',          () => expect(validateAssigneeEmail('')).toBe(''));
  it('should return empty for undefined',                       () => expect(validateAssigneeEmail(undefined)).toBe(''));
  it('should return invalid error without @ symbol',            () => expect(validateAssigneeEmail('notanemail')).toBe(VALIDATION_MESSAGES.assigneeEmail.invalid));
  it('should return invalid error without domain',              () => expect(validateAssigneeEmail('user@')).toBe(VALIDATION_MESSAGES.assigneeEmail.invalid));
  it('should return empty for a valid email',                   () => expect(validateAssigneeEmail('dev@company.com')).toBe(''));
  it('should return empty for subdomain email',                 () => expect(validateAssigneeEmail('user@mail.co.uk')).toBe(''));
});

// ── validateDeadline() ────────────────────────────────────────────────────────

describe('validateDeadline()', () => {
  it('should return empty for undefined deadline',              () => expect(validateDeadline(undefined)).toBe(''));
  it('should return empty for empty string',                    () => expect(validateDeadline('')).toBe(''));
  it('should return pastDate error for yesterday',              () => expect(validateDeadline(yesterday())).toBe(VALIDATION_MESSAGES.deadline.pastDate));
  it('should return empty for tomorrow',                        () => expect(validateDeadline(tomorrow())).toBe(''));
  it('should return pastDate error for old date',               () => expect(validateDeadline('2000-01-01')).toBe(VALIDATION_MESSAGES.deadline.pastDate));
});

// ── validateTaskForm() ────────────────────────────────────────────────────────

describe('validateTaskForm()', () => {
  it('should return no errors for a valid TODO task without assignee', () => {
    const { fieldErrors, formError } = validateTaskForm(buildTask({ title: 'Valid Task' }));
    expect(fieldErrors.title).toBe('');
    expect(fieldErrors.assigneeEmail).toBe('');
    expect(formError).toBe('');
  });

  it('should return title required error for empty title', () => {
    expect(validateTaskForm(buildTask({ title: '' })).fieldErrors.title).toBe(VALIDATION_MESSAGES.title.required);
  });

  it('should require assigneeEmail for IN_PROGRESS task without assignee', () => {
    const task = buildTask({ title: 'Fix Bug', status: 'IN_PROGRESS', assigneeEmail: '' });
    expect(validateTaskForm(task).fieldErrors.assigneeEmail).toBe(VALIDATION_MESSAGES.assigneeEmail.requiredForStatus);
  });

  it('should require assigneeEmail for DONE task without assignee', () => {
    const task = buildTask({ title: 'Fix Bug', status: 'DONE', assigneeEmail: '' });
    expect(validateTaskForm(task).fieldErrors.assigneeEmail).toBe(VALIDATION_MESSAGES.assigneeEmail.requiredForStatus);
  });

  it('should return no email error for DONE task with valid assignee', () => {
    const task = buildTask({ title: 'Fix Bug', status: 'DONE', assigneeEmail: 'dev@co.com' });
    expect(validateTaskForm(task).fieldErrors.assigneeEmail).toBe('');
  });

  it('should return description error when provided but too short', () => {
    expect(validateTaskForm(buildTask({ title: 'Fix Bug', description: 'short' })).fieldErrors.description).toBe(VALIDATION_MESSAGES.description.minLength);
  });

  it('should return deadline error for a past deadline', () => {
    expect(validateTaskForm(buildTask({ title: 'Fix Bug', deadline: yesterday() })).fieldErrors.deadline).toBe(VALIDATION_MESSAGES.deadline.pastDate);
  });
});

// ── isFormErrorFree() ─────────────────────────────────────────────────────────

describe('isFormErrorFree()', () => {
  it('should return true when all errors are empty',        () => expect(isFormErrorFree(getEmptyFieldErrors(), '')).toBe(true));
  it('should return false when there is a title error',     () => expect(isFormErrorFree({ ...getEmptyFieldErrors(), title: 'Required' }, '')).toBe(false));
  it('should return false when there is a form-level error',() => expect(isFormErrorFree(getEmptyFieldErrors(), 'Something went wrong')).toBe(false));
  it('should return false when there is a description error',() => expect(isFormErrorFree({ ...getEmptyFieldErrors(), description: 'Too short' }, '')).toBe(false));
  it('should return false when there is an assignee error', () => expect(isFormErrorFree({ ...getEmptyFieldErrors(), assigneeEmail: 'Required' }, '')).toBe(false));
  it('should return false when there is a deadline error',  () => expect(isFormErrorFree({ ...getEmptyFieldErrors(), deadline: 'Past date' }, '')).toBe(false));
});

// ── getEmptyFieldErrors() ─────────────────────────────────────────────────────

describe('getEmptyFieldErrors()', () => {
  it('should return an object with all empty string fields', () => {
    const e = getEmptyFieldErrors();
    expect(e.title).toBe('');
    expect(e.description).toBe('');
    expect(e.assigneeEmail).toBe('');
    expect(e.deadline).toBe('');
  });
});
