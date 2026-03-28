import { TestBed } from '@angular/core/testing';
import { Project } from './project.service';

describe('ProjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service = TestBed.inject(Project);
    expect(service).toBeTruthy();
  });
});
