import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

describe('TaskService', () => {

  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      TaskService,
      { provide: PLATFORM_ID, useValue: 'browser' }
    ]
  }));

  it('should be created', () => {
    const service = TestBed.inject(TaskService);
    expect(service).toBeTruthy();
  });

});
