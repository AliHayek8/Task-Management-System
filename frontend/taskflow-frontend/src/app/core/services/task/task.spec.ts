import { TestBed } from '@angular/core/testing';
import { Task } from './task.service';

describe('TaskService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service = TestBed.inject(Task);
    expect(service).toBeTruthy();
  });
});
