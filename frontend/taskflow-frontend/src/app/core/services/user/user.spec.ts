import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService, User } from './user.service';
import { PLATFORM_ID } from '@angular/core';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:8080/api/users';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);

    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get user profile', () => {
    const mockUser: User = {
      name: 'John',
      email: 'john@test.com',
    };

    service.getProfile('fake-token').subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne(`${apiUrl}/me`);

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush(mockUser);
  });

  it('should update user name', () => {
    const mockResponse: User = {
      name: 'Updated Name',
      email: 'john@test.com',
    };

    service.updateName('fake-token', 'Updated Name').subscribe((user) => {
      expect(user.name).toBe('Updated Name');
    });

    const req = httpMock.expectOne(`${apiUrl}/me`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Updated Name' });
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush(mockResponse);
  });

  it('should set current user and store in sessionStorage', () => {
    const user: User = {
      name: 'Ali',
      email: 'ali@test.com',
    };

    service.setCurrentUser(user);

    service.currentUser$.subscribe((value) => {
      expect(value).toEqual(user);
    });

    expect(JSON.parse(sessionStorage.getItem('user')!)).toEqual(user);
  });

  it('should load user from sessionStorage', () => {
    const user: User = {
      name: 'Sara',
      email: 'sara@test.com',
    };

    sessionStorage.setItem('user', JSON.stringify(user));

    service.loadFromSession();

    service.currentUser$.subscribe((value) => {
      expect(value).toEqual(user);
    });
  });
});
