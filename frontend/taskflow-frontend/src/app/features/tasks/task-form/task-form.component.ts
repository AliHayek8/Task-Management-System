import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ButtonsModule } from '@progress/kendo-angular-buttons';

import { TaskService, Task } from '../../../core/services/task/task.service';
import { DynamicFormComponent, FormField } from '../../shared-form/dynamic-form.component';
import { TITLE_MIN_LENGTH, DESCRIPTION_MIN_LENGTH } from './task-form.utils';

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(control.value) < today ? { pastDate: true } : null;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonsModule, DynamicFormComponent],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskFormComponent implements OnInit, OnDestroy {

  private readonly taskService = inject(TaskService);
  private readonly fb          = inject(FormBuilder);

  @Input() initialTask!: Task;
  @Input() isEditMode  = false;
  @Input() projectId!: number;

  @Output() taskSaved    = new EventEmitter<Task>();
  @Output() dialogClosed = new EventEmitter<void>();

  taskFormGroup!: FormGroup;
  errorMessage = '';

  private statusSub!: Subscription;

  private get currentStatus(): string {
    return this.taskFormGroup?.get('status')?.value ?? 'TODO';
  }

  get taskFields(): FormField[] {
    return [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        placeholder: `Task title (min ${TITLE_MIN_LENGTH} characters)`,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Details...',
        hint: `(min ${DESCRIPTION_MIN_LENGTH} characters if provided)`,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'TODO',        label: 'To Do' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'DONE',        label: 'Done' },
        ],
      },
      {
        name: 'priority',
        label: 'Priority',
        type: 'select',
        required: true,
        options: [
          { value: 'LOW',    label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH',   label: 'High' },
        ],
      },
      {
        name: 'assigneeEmail',
        label: 'Assignee Email',
        type: 'email',
        placeholder: 'email@example.com',
        hint: this.currentStatus === 'TODO' ? '(optional for To Do)' : undefined,
        // Controls the red * in the label — mirrors the actual validator below
        requiredIf: (form: FormGroup) => form.get('status')?.value !== 'TODO',
      },
      {
        name: 'deadline',
        label: 'Deadline',
        type: 'date',
      },
    ];
  }

  ngOnInit(): void {
    this.taskFormGroup = this.fb.group({
      title:         [this.initialTask.title ?? '',           [Validators.required, Validators.minLength(TITLE_MIN_LENGTH)]],
      description:   [this.initialTask.description ?? '',    [Validators.minLength(DESCRIPTION_MIN_LENGTH)]],
      status:        [this.initialTask.status ?? 'TODO',     Validators.required],
      priority:      [this.initialTask.priority ?? 'MEDIUM', Validators.required],
      assigneeEmail: [this.initialTask.assigneeEmail ?? '',  [Validators.email]],
      deadline:      [this.initialTask.deadline ?? '',       [pastDateValidator]],
    });

    this.updateAssigneeValidators(this.taskFormGroup.get('status')!.value);

    this.statusSub = this.taskFormGroup.get('status')!.valueChanges.subscribe(status => {
      this.updateAssigneeValidators(status);
    });
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
  }


  private updateAssigneeValidators(status: string): void {
    const assigneeControl = this.taskFormGroup.get('assigneeEmail')!;
    if (status !== 'TODO') {
      assigneeControl.setValidators([Validators.required, Validators.email]);
    } else {
      assigneeControl.setValidators([Validators.email]);
    }
    assigneeControl.updateValueAndValidity();
  }

  saveTask(): void {
    if (this.taskFormGroup.invalid) {
      this.taskFormGroup.markAllAsTouched();
      return;
    }

    const formValue = this.taskFormGroup.value as Task;

    if (this.isEditMode) {
      this.taskService.updateTask(this.initialTask.id!, formValue).subscribe({
        next: (updated) => this.taskSaved.emit(updated),
        error: (err)    => this.handleApiError(err),
      });
    } else {
      formValue.projectId = this.projectId;
      this.taskService.createTask(formValue).subscribe({
        next: (created) => this.taskSaved.emit(created),
        error: (err)    => this.handleApiError(err),
      });
    }
  }

  closeDialog(): void {
    this.dialogClosed.emit();
  }

  private handleApiError(err: any): void {
    const payload = err.error ?? {};
    const message = payload.message ?? '';

    if (err.status === 400) {
      if (message.includes('Assignee not found')) {
        this.taskFormGroup.get('assigneeEmail')?.setErrors({ serverError: 'This email is not registered in the system' });
      } else if (payload.description) {
        this.taskFormGroup.get('description')?.setErrors({ serverError: payload.description });
      } else if (payload.title) {
        this.taskFormGroup.get('title')?.setErrors({ serverError: payload.title });
      } else {
        this.errorMessage = message || 'Invalid data. Please check your inputs.';
      }
    } else {
      this.errorMessage = 'Something went wrong. Please try again.';
    }
  }
}
