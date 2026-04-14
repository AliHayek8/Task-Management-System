import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { vi } from 'vitest';

function buildInitialTask(overrides: Partial<Task> = {}): Task {
  return { title: '', description: '', status: 'TODO', priority: 'MEDIUM', assigneeEmail: '', deadline: '', projectId: 5, ...overrides };
}

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture:   ComponentFixture<TaskFormComponent>;
  let taskSvcMock: any;

  beforeEach(async () => {
    taskSvcMock = { createTask: vi.fn(), updateTask: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: TaskService, useValue: taskSvcMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;

    component.initialTask = buildInitialTask();
    component.projectId   = 5;
    component.isEditMode  = false;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise the form with values from initialTask', () => {
    expect(component.taskFormGroup.value.status).toBe('TODO');
    expect(component.taskFormGroup.value.priority).toBe('MEDIUM');
  });


  describe('form validation', () => {
    it('should be invalid when title is empty', () => {
      component.taskFormGroup.patchValue({ title: '' });
      expect(component.taskFormGroup.get('title')?.invalid).toBe(true);
    });

    it('should be invalid when title is shorter than 3 characters', () => {
      component.taskFormGroup.patchValue({ title: 'AB' });
      expect(component.taskFormGroup.get('title')?.invalid).toBe(true);
    });

    it('should be valid when title has at least 3 characters', () => {
      component.taskFormGroup.patchValue({ title: 'Fix' });
      expect(component.taskFormGroup.get('title')?.valid).toBe(true);
    });

    it('should be invalid when description has fewer than 30 characters (but not empty)', () => {
      component.taskFormGroup.patchValue({ description: 'Too short' });
      expect(component.taskFormGroup.get('description')?.invalid).toBe(true);
    });

    it('should be valid when description is empty', () => {
      component.taskFormGroup.patchValue({ description: '' });
      expect(component.taskFormGroup.get('description')?.valid).toBe(true);
    });

    it('should be valid when description has at least 30 characters', () => {
      component.taskFormGroup.patchValue({ description: 'A'.repeat(30) });
      expect(component.taskFormGroup.get('description')?.valid).toBe(true);
    });

    it('should be invalid with a malformed assignee email', () => {
      component.taskFormGroup.patchValue({ assigneeEmail: 'not-an-email' });
      expect(component.taskFormGroup.get('assigneeEmail')?.invalid).toBe(true);
    });

    it('should be valid with a properly formatted assignee email', () => {
      component.taskFormGroup.patchValue({ assigneeEmail: 'dev@company.com' });
      expect(component.taskFormGroup.get('assigneeEmail')?.valid).toBe(true);
    });

    it('should be invalid when a past deadline is set', () => {
      component.taskFormGroup.patchValue({ deadline: '2000-01-01' });
      expect(component.taskFormGroup.get('deadline')?.invalid).toBe(true);
    });

    it('should be valid when a future deadline is set', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      component.taskFormGroup.patchValue({ deadline: tomorrow.toISOString().split('T')[0] });
      expect(component.taskFormGroup.get('deadline')?.valid).toBe(true);
    });
  });


  describe('assigneeEmail required for non-TODO statuses', () => {
    it('should require assigneeEmail when status is IN_PROGRESS', () => {
      component.taskFormGroup.patchValue({ status: 'IN_PROGRESS', assigneeEmail: '' });
      expect(component.taskFormGroup.get('assigneeEmail')?.invalid).toBe(true);
    });

    it('should require assigneeEmail when status is DONE', () => {
      component.taskFormGroup.patchValue({ status: 'DONE', assigneeEmail: '' });
      expect(component.taskFormGroup.get('assigneeEmail')?.invalid).toBe(true);
    });

    it('should NOT require assigneeEmail when status is TODO', () => {
      component.taskFormGroup.patchValue({ status: 'TODO', assigneeEmail: '' });
      expect(component.taskFormGroup.get('assigneeEmail')?.valid).toBe(true);
    });
  });


  describe('saveTask() – create mode', () => {
    const validFormData = { title: 'Fix Bug', description: '', status: 'TODO' as const, priority: 'HIGH' as const, assigneeEmail: '', deadline: '' };

    it('should not call createTask when the form is invalid', () => {
      component.saveTask();
      expect(taskSvcMock.createTask).not.toHaveBeenCalled();
    });

    it('should call createTask with form values in create mode', () => {
      const created: Task = { id: 100, projectId: 5, ...validFormData };
      taskSvcMock.createTask.mockReturnValue(of(created));
      component.taskFormGroup.patchValue(validFormData);
      component.saveTask();
      expect(taskSvcMock.createTask).toHaveBeenCalled();
    });

    it('should emit taskSaved with the created task on success', () => {
      const created: Task = { id: 100, projectId: 5, ...validFormData };
      taskSvcMock.createTask.mockReturnValue(of(created));
      const emitSpy = vi.spyOn(component.taskSaved, 'emit');
      component.taskFormGroup.patchValue(validFormData);
      component.saveTask();
      expect(emitSpy).toHaveBeenCalledWith(created);
    });

    it('should set server error for unknown assignee email (400)', () => {
      taskSvcMock.createTask.mockReturnValue(
        throwError(() => ({ status: 400, error: { message: 'Assignee not found with email: x@y.com' } }))
      );
      component.taskFormGroup.patchValue(validFormData);
      component.saveTask();
      expect(component.taskFormGroup.get('assigneeEmail')?.errors?.['serverError']).toBeTruthy();
    });

    it('should set generic errorMessage on 500 server error', () => {
      taskSvcMock.createTask.mockReturnValue(throwError(() => ({ status: 500, error: {} })));
      component.taskFormGroup.patchValue(validFormData);
      component.saveTask();
      expect(component.errorMessage).toBe('Something went wrong. Please try again.');
    });
  });


  describe('saveTask() – edit mode', () => {
    const validFormData = { title: 'Updated Task', description: '', status: 'TODO' as const, priority: 'LOW' as const, assigneeEmail: '', deadline: '' };

    beforeEach(() => {
      component.isEditMode  = true;
      component.initialTask = buildInitialTask({ id: 42 });
    });

    it('should call updateTask (not createTask) in edit mode', () => {
      const updated: Task = { id: 42, projectId: 5, ...validFormData };
      taskSvcMock.updateTask.mockReturnValue(of(updated));
      component.taskFormGroup.patchValue(validFormData);
      component.saveTask();
      expect(taskSvcMock.updateTask).toHaveBeenCalledWith(42, expect.anything());
      expect(taskSvcMock.createTask).not.toHaveBeenCalled();
    });

    it('should emit taskSaved with the updated task on success', () => {
      const updated: Task = { id: 42, projectId: 5, ...validFormData };
      taskSvcMock.updateTask.mockReturnValue(of(updated));
      const emitSpy = vi.spyOn(component.taskSaved, 'emit');
      component.taskFormGroup.patchValue(validFormData);
      component.saveTask();
      expect(emitSpy).toHaveBeenCalledWith(updated);
    });
  });


  it('should emit dialogClosed event when closeDialog() is called', () => {
    const emitSpy = vi.spyOn(component.dialogClosed, 'emit');
    component.closeDialog();
    expect(emitSpy).toHaveBeenCalled();
  });


  describe('taskFields getter', () => {
    it('should expose a title field',         () => expect(component.taskFields.some(f => f.name === 'title')).toBe(true));
    it('should expose a status field',        () => expect(component.taskFields.some(f => f.name === 'status')).toBe(true));
    it('should expose a priority field',      () => expect(component.taskFields.some(f => f.name === 'priority')).toBe(true));
    it('should expose an assigneeEmail field',() => expect(component.taskFields.some(f => f.name === 'assigneeEmail')).toBe(true));
  });
});
