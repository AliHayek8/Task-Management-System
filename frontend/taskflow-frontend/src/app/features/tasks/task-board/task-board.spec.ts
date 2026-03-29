import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskBoard } from './task-board.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PLATFORM_ID } from '@angular/core';

describe('TaskBoard', () => {
  let component: TaskBoard;
  let fixture: ComponentFixture<TaskBoard>;
  let taskServiceMock: any;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'Description 1',
      status: 'TODO',
      priority: 'HIGH',
      projectId: 1
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Description 2',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projectId: 1
    },
    {
      id: 3,
      title: 'Test Task 3',
      description: 'Description 3',
      status: 'DONE',
      priority: 'LOW',
      projectId: 1
    }
  ];

  beforeEach(async () => {
    taskServiceMock = {
      getTasksByProject: vi.fn().mockReturnValue(of(mockTasks)),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        TaskBoard,
        CommonModule,
        FormsModule,
        RouterModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: TaskService, useValue: taskServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', async () => {
    component.loadTasks();
    await fixture.whenStable();
    expect(taskServiceMock.getTasksByProject).toHaveBeenCalled();
  });

  it('should filter tasks by status', () => {
    component.tasks.set(mockTasks);
    expect(component.getTasksByStatus('TODO').length).toBe(1);
    expect(component.getTasksByStatus('IN_PROGRESS').length).toBe(1);
    expect(component.getTasksByStatus('DONE').length).toBe(1);
  });

  it('should open dialog for new task', () => {
    component.openAddDialog('TODO');
    expect(component.showDialog()).toBe(true);
    expect(component.isEditMode()).toBe(false);
    expect(component.taskForm.status).toBe('TODO');
  });

  it('should open dialog for edit task', () => {
    component.openEditDialog(mockTasks[0]);
    expect(component.showDialog()).toBe(true);
    expect(component.isEditMode()).toBe(true);
    expect(component.taskForm.title).toBe('Test Task 1');
  });

  it('should close dialog', () => {
    component.showDialog.set(true);
    component.closeDialog();
    expect(component.showDialog()).toBe(false);
  });

  it('should show error if title is empty', () => {
    component.taskForm.title = '';
    component.saveTask();
    expect(component.errorMessage).toBe('Title is required');
  });

  it('should show error if assignee email is invalid', () => {
    component.taskForm.title = 'Test';
    component.taskForm.assigneeEmail = 'invalid-email';
    component.saveTask();
    expect(component.errorMessage).toBe('Please enter a valid email for assignee');
  });

  it('should create new task successfully', () => {
    const newTask: Task = {
      id: 4,
      title: 'New Task',
      description: 'New Description',
      status: 'TODO',
      priority: 'HIGH',
      projectId: 1
    };

    taskServiceMock.createTask.mockReturnValue(of(newTask));
    component.tasks.set(mockTasks);
    component.taskForm = { ...newTask };
    component.isEditMode.set(false);
    component.saveTask();

    expect(taskServiceMock.createTask).toHaveBeenCalled();
  });

  it('should update task successfully', () => {
    const updatedTask = { ...mockTasks[0], title: 'Updated Task' };
    taskServiceMock.updateTask.mockReturnValue(of(updatedTask));

    component.tasks.set(mockTasks);
    component.taskForm = { ...updatedTask };
    component.isEditMode.set(true);
    component.saveTask();

    expect(taskServiceMock.updateTask).toHaveBeenCalled();
  });

  it('should delete task successfully', () => {
    taskServiceMock.deleteTask.mockReturnValue(of(void 0));
    component.tasks.set(mockTasks);
    component.deleteTask(mockTasks[0]);

    expect(taskServiceMock.deleteTask).toHaveBeenCalledWith(1);
    expect(component.tasks().length).toBe(2);
  });

  it('should change task status successfully', () => {
    const updatedTask = { ...mockTasks[0], status: 'IN_PROGRESS' as const };
    taskServiceMock.updateTaskStatus.mockReturnValue(of(updatedTask));

    component.tasks.set(mockTasks);
    component.changeStatus(mockTasks[0], 'IN_PROGRESS');

    expect(taskServiceMock.updateTaskStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS');
  });

  it('should return correct priority colors', () => {
    expect(component.getPriorityColor('HIGH')).toBe('#ef4444');
    expect(component.getPriorityColor('MEDIUM')).toBe('#f97316');
    expect(component.getPriorityColor('LOW')).toBe('#22c55e');
  });
});
