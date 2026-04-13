import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { guestGuard } from './guest.guard';

function buildJwt(exp: number): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'user@test.com', exp }));
  return `${header}.${payload}.signature`;
}

const fakeRoute = {} as ActivatedRouteSnapshot;
const fakeState = {} as RouterStateSnapshot;

function runGuard() {
  return TestBed.runInInjectionContext(() => guestGuard(fakeRoute, fakeState));
}

describe('guestGuard', () => {
  const futureExp    = Math.floor(Date.now() / 1000) + 3600;
  const pastExp      = Math.floor(Date.now() / 1000) - 3600;
  const validToken   = buildJwt(futureExp);
  const expiredToken = buildJwt(pastExp);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { createUrlTree: (commands: any[]) => ({ commands }) },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('should return true when no token is stored (allow guest access)', () => {
    expect(runGuard()).toBe(true);
  });

  it('should return true when the token is expired (treat as unauthenticated)', () => {
    sessionStorage.setItem('token', expiredToken);
    expect(runGuard()).toBe(true);
  });

  it('should return true when the token is malformed', () => {
    sessionStorage.setItem('token', 'not.a.jwt');
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /dashboard when a valid token exists', () => {
    sessionStorage.setItem('token', validToken);
    const result: any = runGuard();
    expect(result?.commands).toEqual(['/dashboard']);
  });

  it('should clear sessionStorage when token is expired', () => {
    sessionStorage.setItem('token', expiredToken);
    sessionStorage.setItem('user', JSON.stringify({ id: 5 }));
    runGuard();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  it('should NOT clear sessionStorage when user is authenticated', () => {
    sessionStorage.setItem('token', validToken);
    sessionStorage.setItem('user', JSON.stringify({ id: 5 }));
    runGuard();
    expect(sessionStorage.getItem('token')).toBe(validToken);
  });

  it('should return true in a non-browser environment without redirecting', () => {
    TestBed.resetTestingModule();
    const createUrlTreeMock = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { createUrlTree: createUrlTreeMock } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const result = TestBed.runInInjectionContext(() => guestGuard(fakeRoute, fakeState));
    expect(result).toBe(true);
    expect(createUrlTreeMock).not.toHaveBeenCalled();
  });
});
