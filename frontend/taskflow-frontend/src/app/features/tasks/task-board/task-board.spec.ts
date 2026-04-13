import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskBoard } from './task-board.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectService } from '../../../core/services/project/project.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { vi } from 'vitest';

const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Design UI',     description: 'Create wireframes', status: 'TODO',        priority: 'HIGH',   projectId: 10 },
  { id: 2, title: 'Implement API', description: 'REST endpoints',    status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: 10, assigneeEmail: 'dev@co.com' },
  { id: 3, title: 'Write tests',   description: 'Unit tests',        status: 'DONE',        priority: 'LOW',    projectId: 10, assigneeEmail: 'qa@co.com' },
  { id: 4, title: 'Code review',   description: '',                   status: 'TODO',        priority: 'LOW',    projectId: 10 },
];

describe('TaskBoard', () => {
  let component: TaskBoard;
  let fixture:   ComponentFixture<TaskBoard>;
  let taskSvc:   any;
  let projectSvc: any;
  let routerMock: any;

  beforeEach(async () => {
    taskSvc    = { getTasksByProject: vi.fn().mockReturnValue(of(MOCK_TASKS)), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn(), updateTaskStatus: vi.fn() };
    projectSvc = { getProjectsByOwner: vi.fn().mockReturnValue(of([{ id: 10, name: 'My Project', description: '' }])) };
    routerMock = { navigate: vi.fn() };

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'user') return JSON.stringify({ id: 7, email: 'owner@co.com' });
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [TaskBoard, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: TaskService,    useValue: taskSvc },
        { provide: ProjectService, useValue: projectSvc },
        { provide: Router,         useValue: routerMock },
        { provide: PLATFORM_ID,    useValue: 'browser' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '10' } } } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(TaskBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  // ── Creation & initialisation ─────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should read projectId from the route on init', () => {
    expect(component.projectId).toBe(10);
  });

  it('should load tasks on init when running in a browser', () => {
    expect(taskSvc.getTasksByProject).toHaveBeenCalledWith(10);
  });

  it('should populate the tasks signal after loadTasks()', () => {
    expect(component.tasks().length).toBe(4);
  });

  it('should resolve project name from the projects list', () => {
    expect(component.projectName).toBe('My Project');
  });

  // ── filteredByStatus() ────────────────────────────────────────────────────

  describe('filteredByStatus()', () => {
    it('should return only TODO tasks', () => {
      expect(component.filteredByStatus('TODO').length).toBe(2);
    });

    it('should return only IN_PROGRESS tasks', () => {
      expect(component.filteredByStatus('IN_PROGRESS').length).toBe(1);
    });

    it('should return only DONE tasks', () => {
      expect(component.filteredByStatus('DONE').length).toBe(1);
    });

    it('should return an empty array for an unknown status', () => {
      expect(component.filteredByStatus('UNKNOWN').length).toBe(0);
    });
  });

  // ── search & priority filtering ───────────────────────────────────────────

  describe('search & priority filter', () => {
    it('should filter tasks by title when a search query is set', () => {
      component.onSearch('Design');
      expect(component.filteredTasks().length).toBe(1);
      expect(component.filteredTasks()[0].title).toBe('Design UI');
    });

    it('should filter tasks by assignee email', () => {
      component.onSearch('dev@co.com');
      expect(component.filteredTasks().length).toBe(1);
    });

    it('should return all tasks when the search query is cleared', () => {
      component.onSearch('Design');
      component.onSearch('');
      expect(component.filteredTasks().length).toBe(4);
    });

    it('should filter tasks by HIGH priority', () => {
      component.onPriorityChange('HIGH');
      expect(component.filteredTasks().every(t => t.priority === 'HIGH')).toBe(true);
    });

    it('should return all tasks when priority is ALL', () => {
      component.onPriorityChange('ALL');
      expect(component.filteredTasks().length).toBe(4);
    });
  });

  // ── Dialog management ─────────────────────────────────────────────────────

  describe('dialog management', () => {
    it('should open dialog in add mode when openAddDialog() is called', () => {
      component.openAddDialog('TODO');
      expect(component.showDialog()).toBe(true);
      expect(component.isEditMode()).toBe(false);
    });

    it('should preset selectedTask status to the passed status', () => {
      component.openAddDialog('IN_PROGRESS');
      expect(component.selectedTask()?.status).toBe('IN_PROGRESS');
    });

    it('should open dialog in edit mode when openEditDialog() is called', () => {
      component.openEditDialog(MOCK_TASKS[0]);
      expect(component.showDialog()).toBe(true);
      expect(component.isEditMode()).toBe(true);
    });

    it('should copy the selected task into selectedTask signal', () => {
      component.openEditDialog(MOCK_TASKS[0]);
      expect(component.selectedTask()?.id).toBe(1);
      expect(component.selectedTask()?.title).toBe('Design UI');
    });

    it('should close the dialog and clear selectedTask when closeDialog() is called', () => {
      component.openEditDialog(MOCK_TASKS[0]);
      component.closeDialog();
      expect(component.showDialog()).toBe(false);
      expect(component.selectedTask()).toBeNull();
    });
  });

  // ── onTaskSaved() ─────────────────────────────────────────────────────────

  describe('onTaskSaved()', () => {
    it('should add a new task to the tasks signal when not in edit mode', () => {
      const newTask: Task = { id: 99, title: 'New Task', description: '', status: 'TODO', priority: 'LOW', projectId: 10 };
      component.isEditMode.set(false);
      component.onTaskSaved(newTask);
      expect(component.tasks().some(t => t.id === 99)).toBe(true);
    });

    it('should replace the existing task in the signal when in edit mode', () => {
      const updated: Task = { ...MOCK_TASKS[0], title: 'Design UI – v2' };
      component.isEditMode.set(true);
      component.tasks.set([...MOCK_TASKS]);
      component.onTaskSaved(updated);
      expect(component.tasks().find(t => t.id === 1)?.title).toBe('Design UI – v2');
    });

    it('should close the dialog after saving', () => {
      component.showDialog.set(true);
      component.isEditMode.set(false);
      component.onTaskSaved(MOCK_TASKS[0]);
      expect(component.showDialog()).toBe(false);
    });
  });

  // ── deleteTask() ──────────────────────────────────────────────────────────

  describe('deleteTask()', () => {
    it('should remove the task from the signal on success', () => {
      taskSvc.deleteTask.mockReturnValue(of(undefined));
      component.tasks.set([...MOCK_TASKS]);
      component.deleteTask(MOCK_TASKS[0]);
      expect(component.tasks().some(t => t.id === 1)).toBe(false);
    });

    it('should keep tasks intact and set globalTaskError on failure', fakeAsync(() => {
      taskSvc.deleteTask.mockReturnValue(throwError(() => ({ status: 500 })));
      component.tasks.set([...MOCK_TASKS]);
      component.deleteTask(MOCK_TASKS[0]);
      expect(component.tasks().length).toBe(4);
      expect(component.globalTaskError).toContain('delete');
      tick(5000);
    }));
  });

  // ── changeStatus() ────────────────────────────────────────────────────────

  describe('changeStatus()', () => {
    it('should call updateTaskStatus with the correct id and status', () => {
      const updated = { ...MOCK_TASKS[1], status: 'DONE' as const };
      taskSvc.updateTaskStatus.mockReturnValue(of(updated));
      component.tasks.set([...MOCK_TASKS]);
      component.changeStatus(MOCK_TASKS[1], 'DONE');
      expect(taskSvc.updateTaskStatus).toHaveBeenCalledWith(2, 'DONE');
    });

    it('should update the task in the signal on success', () => {
      const updated = { ...MOCK_TASKS[1], status: 'DONE' as const };
      taskSvc.updateTaskStatus.mockReturnValue(of(updated));
      component.tasks.set([...MOCK_TASKS]);
      component.changeStatus(MOCK_TASKS[1], 'DONE');
      expect(component.tasks().find(t => t.id === 2)?.status).toBe('DONE');
    });

    it('should show error and NOT call service when moving unassigned task to IN_PROGRESS', () => {
      component.changeStatus(MOCK_TASKS[0], 'IN_PROGRESS');
      expect(taskSvc.updateTaskStatus).not.toHaveBeenCalled();
      expect(component.globalTaskError).toContain('assign');
    });
  });

  // ── Drag & drop ───────────────────────────────────────────────────────────

  describe('drag & drop', () => {
    it('should set draggedTask on dragStart', () => {
      component.onDragStart(MOCK_TASKS[0]);
      expect(component.draggedTask).toEqual(MOCK_TASKS[0]);
    });

    it('should clear draggedTask on successful drop', () => {
      const updated = { ...MOCK_TASKS[1], status: 'DONE' as const };
      taskSvc.updateTaskStatus.mockReturnValue(of(updated));
      component.tasks.set([...MOCK_TASKS]);
      component.onDragStart(MOCK_TASKS[1]);
      component.onDrop('DONE');
      expect(component.draggedTask).toBeNull();
    });

    it('should do nothing if draggedTask is null on drop', () => {
      component.draggedTask = null;
      component.onDrop('DONE');
      expect(taskSvc.updateTaskStatus).not.toHaveBeenCalled();
    });
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('should navigate to /projects when goBackToProjects() is called', () => {
    component.goBackToProjects();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/projects']);
  });

  // ── getPriorityColor() ────────────────────────────────────────────────────

  describe('getPriorityColor()', () => {
    it('should return red for HIGH priority',    () => expect(component.getPriorityColor('HIGH')).toBe('#ef4444'));
    it('should return orange for MEDIUM priority', () => expect(component.getPriorityColor('MEDIUM')).toBe('#f97316'));
    it('should return green for LOW priority',   () => expect(component.getPriorityColor('LOW')).toBe('#22c55e'));
    it('should return a fallback for unknown',   () => expect(component.getPriorityColor('UNKNOWN')).toBeTruthy());
  });
});
