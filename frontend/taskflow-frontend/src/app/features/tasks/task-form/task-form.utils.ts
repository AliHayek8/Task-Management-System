// ============================================================
// Task Form Utilities
// Validation logic, constants, and error messages for TaskFormComponent
// ============================================================

import { Task } from '../../../core/services/task/task.service';

// ------ Validation Constants ------

export const TITLE_MIN_LENGTH = 3;
export const DESCRIPTION_MIN_LENGTH = 30;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ------ Validation Error Messages ------

export const VALIDATION_MESSAGES = {
  title: {
    required: 'Title is required',
    minLength: `Title must be at least ${TITLE_MIN_LENGTH} characters`,
  },
  description: {
    minLength: `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`,
  },
  assigneeEmail: {
    invalid: 'Please enter a valid email',
    requiredForStatus: 'Assignee email is required for In Progress and Done tasks',
  },
  deadline: {
    pastDate: 'Deadline cannot be in the past',
  },
} as const;

// ------ Field Error Shape ------

export interface TaskFieldErrors {
  title: string;
  description: string;
  assigneeEmail: string;
  deadline: string;
}

/** Returns a fresh, empty field-errors object */
export function getEmptyFieldErrors(): TaskFieldErrors {
  return { title: '', description: '', assigneeEmail: '', deadline: '' };
}

// ------ Individual Field Validators ------

/** Validates the task title and returns an error message or empty string */
export function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return VALIDATION_MESSAGES.title.required;
  if (trimmed.length < TITLE_MIN_LENGTH) return VALIDATION_MESSAGES.title.minLength;
  return '';
}

/** Validates the optional description and returns an error message or empty string */
export function validateDescription(description: string | undefined): string {
  const trimmed = (description ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.length < DESCRIPTION_MIN_LENGTH) return VALIDATION_MESSAGES.description.minLength;
  return '';
}

/** Validates the optional assignee email and returns an error message or empty string */
export function validateAssigneeEmail(email: string | undefined): string {
  const trimmed = (email ?? '').trim();
  if (!trimmed) return '';
  if (!EMAIL_REGEX.test(trimmed)) return VALIDATION_MESSAGES.assigneeEmail.invalid;
  return '';
}

/** Validates the optional deadline and returns an error message or empty string */
export function validateDeadline(deadline: string | undefined): string {
  if (!deadline) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  if (deadlineDate < today) return VALIDATION_MESSAGES.deadline.pastDate;
  return '';
}

// ------ Full Form Validation ------

/**
 * Runs all field validators against the given task form data.
 * Returns the populated field-errors object and a top-level error message (if any).
 */
export function validateTaskForm(taskForm: Task): {
  fieldErrors: TaskFieldErrors;
  formError: string;
} {
  const fieldErrors: TaskFieldErrors = {
    title:         validateTitle(taskForm.title),
    description:   validateDescription(taskForm.description),
    assigneeEmail: validateAssigneeEmail(taskForm.assigneeEmail),
    deadline:      validateDeadline(taskForm.deadline),
  };

  if (taskForm.status !== 'TODO' && !taskForm.assigneeEmail?.trim()) {
    fieldErrors.assigneeEmail = VALIDATION_MESSAGES.assigneeEmail.requiredForStatus;
  }

  return { fieldErrors, formError: '' };
}

/** Returns true when none of the field errors have a message */
export function isFormErrorFree(fieldErrors: TaskFieldErrors, formError: string): boolean {
  return (
    !formError &&
    !fieldErrors.title &&
    !fieldErrors.description &&
    !fieldErrors.assigneeEmail &&
    !fieldErrors.deadline
  );
}
