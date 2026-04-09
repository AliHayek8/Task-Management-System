import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonsModule } from '@progress/kendo-angular-buttons';

import { TaskService, Task } from '../../../core/services/task/task.service';
import {
  TaskFieldErrors,
  getEmptyFieldErrors,
  validateTitle,
  validateDescription,
  validateAssigneeEmail,
  validateDeadline,
  validateTaskForm,
  isFormErrorFree,
} from './task-form.utils';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskFormComponent implements OnInit {

  private readonly taskService = inject(TaskService);
  private readonly cdr         = inject(ChangeDetectorRef);

  @Input() initialTask!: Task;
  @Input() isEditMode  = false;
  @Input() projectId!: number;

  @Output() taskSaved    = new EventEmitter<Task>();
  @Output() dialogClosed = new EventEmitter<void>();

  taskForm!: Task;
  fieldErrors: TaskFieldErrors = getEmptyFieldErrors();
  errorMessage = '';


  ngOnInit(): void {
    // Work on a local copy so the parent's signal is not mutated directly
    this.taskForm = { ...this.initialTask };
  }


  // Per-field Validation (called from template on input/blur)


  validateTitle(): void {
    this.fieldErrors.title = validateTitle(this.taskForm.title);
  }

  validateDescription(): void {
    this.fieldErrors.description = validateDescription(this.taskForm.description);
  }

  validateAssigneeEmail(): void {
    this.fieldErrors.assigneeEmail = validateAssigneeEmail(this.taskForm.assigneeEmail);
  }

  validateDeadline(): void {
    this.fieldErrors.deadline = validateDeadline(this.taskForm.deadline);
  }


  saveTask(): void {
    const { fieldErrors, formError } = validateTaskForm(this.taskForm);
    this.fieldErrors  = fieldErrors;
    this.errorMessage = formError;

    if (!isFormErrorFree(fieldErrors, formError)) return;

    if (this.isEditMode) {
      this.taskService.updateTask(this.taskForm.id!, this.taskForm).subscribe({
        next: (updatedTask) => {
          this.taskSaved.emit(updatedTask);
        },
        error: (err) => {
          this.handleApiError(err);
        },
      });
    } else {
      this.taskForm.projectId = this.projectId;
      this.taskService.createTask(this.taskForm).subscribe({
        next: (newTask) => {
          this.taskSaved.emit(newTask);
        },
        error: (err) => {
          this.handleApiError(err);
        },
      });
    }
  }


  closeDialog(): void {
    this.dialogClosed.emit();
  }


  // Private Helpers

  private handleApiError(err: any): void {
    if (err.status === 400) {
      const errorPayload = err.error || {};
      const message      = errorPayload.message || '';

      if (message.includes('Assignee not found')) {
        this.fieldErrors.assigneeEmail = 'This email is not registered in the system';
      } else if (errorPayload.description) {
        this.fieldErrors.description = errorPayload.description;
      } else if (errorPayload.title) {
        this.fieldErrors.title = errorPayload.title;
      } else if (message) {
        this.errorMessage = message;
      } else {
        this.errorMessage = 'Invalid data. Please check your inputs.';
      }
    } else {
      this.errorMessage = 'Something went wrong. Please try again.';
    }

    this.cdr.detectChanges();
  }
}
