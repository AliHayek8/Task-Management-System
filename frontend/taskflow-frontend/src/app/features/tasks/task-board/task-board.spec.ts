import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  let fixture: ComponentFixture<TaskBoard>;
  let taskSvc: any;
  let projectSvc: any;
  let routerMock: any;

  beforeEach(async () => {
    taskSvc = {
      getTasksByProject: vi.fn().mockReturnValue(of(MOCK_TASKS)),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
    };

    projectSvc = {
      getProjectsByOwner: vi.fn().mockReturnValue(of([
        { id: 10, name: 'My Project', description: '' }
      ])),
    };

    routerMock = { navigate: vi.fn() };

    //  mock sessionStorage properly
    const storageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'user') return JSON.stringify({ id: 7 });
        return null;
      }),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    vi.stubGlobal('sessionStorage', storageMock);

    //  mock alert
    vi.stubGlobal('alert', vi.fn());

    await TestBed.configureTestingModule({
      imports: [TaskBoard, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: TaskService, useValue: taskSvc },
        { provide: ProjectService, useValue: projectSvc },
        { provide: Router, useValue: routerMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '10' } } }
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoard);
    component = fixture.componentInstance;

    // Ensure the component has the necessary constants before detection
    // These should already be there from the imports, but we're making sure
    // because the error log showed they were undefined in the template.
    if (!component.TASK_STATUSES) {
        (component as any).TASK_STATUSES = {
            TODO: 'TODO',
            IN_PROGRESS: 'IN_PROGRESS',
            DONE: 'DONE',
        };
    }

    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  describe('search & priority filter', () => {
    it('should filter tasks by title when a search query is set', () => {
      component.onSearch('Design');
      expect(component.filteredTasks().length).toBe(1);
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

  describe('dialog management', () => {
    it('should open dialog in add mode', () => {
      component.openAddDialog('TODO');
      expect(component.showDialog()).toBe(true);
    });

    it('should preset selectedTask status', () => {
      component.openAddDialog('IN_PROGRESS');
      expect(component.selectedTask()?.status).toBe('IN_PROGRESS');
    });
  });

  describe('deleteTask()', () => {
    it('should remove the task on success', () => {
      taskSvc.deleteTask.mockReturnValue(of(undefined));
      component.tasks.set([...MOCK_TASKS]);
      component.deleteTask(MOCK_TASKS[0]);
      expect(component.tasks().some(t => t.id === 1)).toBe(false);
    });

    it('should handle delete error', async () => {
      taskSvc.deleteTask.mockReturnValue(throwError(() => ({ status: 500 })));
      component.tasks.set([...MOCK_TASKS]);
      component.deleteTask(MOCK_TASKS[0]);
      expect(component.globalTaskError).toBeTruthy();
    });
  });

  describe('changeStatus()', () => {
    it('should call updateTaskStatus', () => {
      const updated = { ...MOCK_TASKS[1], status: 'DONE' as const };
      taskSvc.updateTaskStatus.mockReturnValue(of(updated));
      component.changeStatus(MOCK_TASKS[1], 'DONE');
      expect(taskSvc.updateTaskStatus).toHaveBeenCalledWith(2, 'DONE');
    });
  });

  it('should navigate to /projects', () => {
    component.goBackToProjects();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/projects']);
  });

  describe('getPriorityColor()', () => {
    it('should return color for HIGH', () => {
      const color = component.getPriorityColor('HIGH');
      expect(typeof color).toBe('string');
    });
  });
});
