import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';

function buildJwt(exp: number): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'user@test.com', exp }));
  return `${header}.${payload}.signature`;
}

const fakeRoute = {} as ActivatedRouteSnapshot;
const fakeState = {} as RouterStateSnapshot;

function runGuard() {
  return TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
}

describe('authGuard', () => {
  const futureExp    = Math.floor(Date.now() / 1000) + 3600;
  const pastExp      = Math.floor(Date.now() / 1000) - 3600;
  const validToken   = buildJwt(futureExp);
  const expiredToken = buildJwt(pastExp);

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateMock = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: navigateMock,
            createUrlTree: (commands: any[]) => ({ commands }),
          },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('should return true when a valid token is present', () => {
    sessionStorage.setItem('token', validToken);
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /auth when no token exists', () => {
    const result: any = runGuard();
    expect(result?.commands).toEqual(['/auth']);
  });

  it('should redirect to /auth when the token is expired', () => {
    sessionStorage.setItem('token', expiredToken);
    const result: any = runGuard();
    expect(result?.commands).toEqual(['/auth']);
  });

  it('should redirect to /auth when the token is malformed', () => {
    sessionStorage.setItem('token', 'not.a.valid.jwt');
    const result: any = runGuard();
    expect(result?.commands).toEqual(['/auth']);
  });

  it('should clear token from sessionStorage when token is expired', () => {
    sessionStorage.setItem('token', expiredToken);
    sessionStorage.setItem('user', JSON.stringify({ id: 1 }));
    runGuard();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  it('should NOT clear sessionStorage when token is valid', () => {
    sessionStorage.setItem('token', validToken);
    sessionStorage.setItem('user', JSON.stringify({ id: 1 }));
    runGuard();
    expect(sessionStorage.getItem('token')).toBe(validToken);
    expect(sessionStorage.getItem('user')).not.toBeNull();
  });

  it('should redirect to /auth in non-browser environment (SSR)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { createUrlTree: (commands: any[]) => ({ commands }) },
        },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const result: any = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(result?.commands).toEqual(['/auth']);
  });
});
