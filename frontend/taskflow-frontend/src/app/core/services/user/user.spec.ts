import { TestBed } from '@angular/core/testing';
import { User } from './user.service';

describe('UserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service = TestBed.inject(User);
    expect(service).toBeTruthy();
  });
});
