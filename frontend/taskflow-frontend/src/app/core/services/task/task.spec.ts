import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { TaskService, Task } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const BASE_URL = 'http://localhost:8080/api';

  const mockTask: Task = {
    id: 1,
    title: 'Fix login bug',
    description: 'Users cannot log in with Gmail accounts',
    status: 'TODO',
    priority: 'HIGH',
    projectId: 42,
    assigneeEmail: 'dev@company.com',
    assigneeName: 'Bob Dev',
    deadline: '2025-12-31',
  };

  const mockTasks: Task[] = [
    mockTask,
    { id: 2, title: 'Write unit tests', description: '', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: 42 },
    { id: 3, title: 'Deploy to production', description: '', status: 'DONE', priority: 'LOW', projectId: 42 },
  ];

  beforeEach(() => {
    // Stub sessionStorage so the service can read a token
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-jwt-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    service  = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getTasksByProject() ────────────────────────────────────────────────────

  describe('getTasksByProject()', () => {
    it('should GET tasks for a given project id', () => {
      service.getTasksByProject(42).subscribe((tasks) => {
        expect(tasks).toEqual(mockTasks);
        expect(tasks.length).toBe(3);
      });
      const req = httpMock.expectOne(`${BASE_URL}/projects/42/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should send an Authorization header', () => {
      service.getTasksByProject(42).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/projects/42/tasks`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
      req.flush([]);
    });

    it('should return an empty array when project has no tasks', () => {
      service.getTasksByProject(99).subscribe((tasks) => expect(tasks).toEqual([]));
      httpMock.expectOne(`${BASE_URL}/projects/99/tasks`).flush([]);
    });

    it('should propagate a 404 error when project is not found', () => {
      let err: any;
      service.getTasksByProject(0).subscribe({ error: (e) => (err = e) });
      httpMock.expectOne(`${BASE_URL}/projects/0/tasks`).flush(
        { message: 'Project not found' }, { status: 404, statusText: 'Not Found' }
      );
      expect(err.status).toBe(404);
    });
  });

  // ── createTask() ──────────────────────────────────────────────────────────

  describe('createTask()', () => {
    const newTask: Task = { title: 'New Feature', description: 'Implement dark mode', status: 'TODO', priority: 'MEDIUM', projectId: 42 };

    it('should POST to /tasks and return the created task', () => {
      const created = { ...newTask, id: 10 };
      service.createTask(newTask).subscribe((task) => {
        expect(task).toEqual(created);
        expect(task.id).toBe(10);
      });
      const req = httpMock.expectOne(`${BASE_URL}/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      req.flush(created);
    });

    it('should send Authorization header when creating a task', () => {
      service.createTask(newTask).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/tasks`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
      req.flush({ ...newTask, id: 10 });
    });

    it('should propagate 400 error on invalid task data', () => {
      let err: any;
      service.createTask(newTask).subscribe({ error: (e) => (err = e) });
      httpMock.expectOne(`${BASE_URL}/tasks`).flush(
        { message: 'Title is required' }, { status: 400, statusText: 'Bad Request' }
      );
      expect(err.status).toBe(400);
    });
  });

  // ── updateTask() ──────────────────────────────────────────────────────────

  describe('updateTask()', () => {
    it('should PUT to /tasks/:id and return the updated task', () => {
      const updated = { ...mockTask, title: 'Fixed – UPDATED', priority: 'MEDIUM' as const };
      service.updateTask(1, updated).subscribe((task) => {
        expect(task.title).toBe('Fixed – UPDATED');
        expect(task.priority).toBe('MEDIUM');
      });
      const req = httpMock.expectOne(`${BASE_URL}/tasks/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(updated);
    });

    it('should propagate 404 when task does not exist', () => {
      let err: any;
      service.updateTask(999, mockTask).subscribe({ error: (e) => (err = e) });
      httpMock.expectOne(`${BASE_URL}/tasks/999`).flush(
        { message: 'Task not found' }, { status: 404, statusText: 'Not Found' }
      );
      expect(err.status).toBe(404);
    });
  });

  // ── deleteTask() ──────────────────────────────────────────────────────────

  describe('deleteTask()', () => {
    it('should DELETE /tasks/:id', () => {
      service.deleteTask(1).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/tasks/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should send Authorization header when deleting', () => {
      service.deleteTask(1).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/tasks/1`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
      req.flush(null);
    });

    it('should propagate 404 when task is already deleted', () => {
      let err: any;
      service.deleteTask(999).subscribe({ error: (e) => (err = e) });
      httpMock.expectOne(`${BASE_URL}/tasks/999`).flush(
        { message: 'Task not found' }, { status: 404, statusText: 'Not Found' }
      );
      expect(err.status).toBe(404);
    });
  });

  // ── updateTaskStatus() ────────────────────────────────────────────────────

  describe('updateTaskStatus()', () => {
    it('should PATCH /tasks/:id/status with IN_PROGRESS', () => {
      const updated = { ...mockTask, status: 'IN_PROGRESS' as const };
      service.updateTaskStatus(1, 'IN_PROGRESS').subscribe((task) => {
        expect(task.status).toBe('IN_PROGRESS');
      });
      const req = httpMock.expectOne(`${BASE_URL}/tasks/1/status?status=IN_PROGRESS`);
      expect(req.request.method).toBe('PATCH');
      req.flush(updated);
    });

    it('should PATCH status to DONE', () => {
      const done = { ...mockTask, status: 'DONE' as const };
      service.updateTaskStatus(1, 'DONE').subscribe((t) => expect(t.status).toBe('DONE'));
      httpMock.expectOne(`${BASE_URL}/tasks/1/status?status=DONE`).flush(done);
    });

    it('should PATCH status back to TODO', () => {
      const todo = { ...mockTask, status: 'TODO' as const };
      service.updateTaskStatus(1, 'TODO').subscribe((t) => expect(t.status).toBe('TODO'));
      httpMock.expectOne(`${BASE_URL}/tasks/1/status?status=TODO`).flush(todo);
    });
  });
});
