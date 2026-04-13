import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { vi } from 'vitest';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authServiceMock: any;
  let router: Router;

  const mockAuthResponse = { id: 1, token: 'jwt-token', name: 'Alice Smith', email: 'alice@example.com' };

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        AuthComponent,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([]),
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    router    = TestBed.inject(Router);
    fixture   = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start in login mode', () => {
    expect(component.isLoginMode).toBe(true);
  });

  it('should initialise loginForm with empty email and password', () => {
    expect(component.loginForm.value).toEqual({ email: '', password: '' });
  });

  it('should initialise registerForm with empty name, email, and password', () => {
    expect(component.registerForm.value).toEqual({ name: '', email: '', password: '' });
  });

  it('should have no error message on start', () => {
    expect(component.errorMessage).toBe('');
  });

  // ── toggleMode() ──────────────────────────────────────────────────────────

  describe('toggleMode()', () => {
    it('should switch from login to register mode', () => {
      component.toggleMode();
      expect(component.isLoginMode).toBe(false);
    });

    it('should switch back to login mode on second toggle', () => {
      component.toggleMode();
      component.toggleMode();
      expect(component.isLoginMode).toBe(true);
    });

    it('should clear error message when toggling', () => {
      component.errorMessage = 'Some error';
      component.toggleMode();
      expect(component.errorMessage).toBe('');
    });

    it('should reset loginForm when toggling', () => {
      component.loginForm.setValue({ email: 'x@x.com', password: '123' });
      component.toggleMode();
      expect(component.loginForm.get('email')?.value).toBeFalsy();
    });
  });

  // ── Form validation ───────────────────────────────────────────────────────

  describe('loginForm validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be invalid with an incorrect email format', () => {
      component.loginForm.setValue({ email: 'not-an-email', password: '123456' });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be valid with correct email and any password', () => {
      component.loginForm.setValue({ email: 'valid@example.com', password: 'anypassword' });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('registerForm validation', () => {
    it('should be invalid when empty', () => {
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should be invalid with a password shorter than 6 characters', () => {
      component.registerForm.setValue({ name: 'Bob', email: 'b@b.com', password: '123' });
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should be valid with all required fields correctly filled', () => {
      component.registerForm.setValue({ name: 'Bob', email: 'b@b.com', password: 'securepass' });
      expect(component.registerForm.valid).toBe(true);
    });
  });

  // ── onLogin() ─────────────────────────────────────────────────────────────

  describe('onLogin()', () => {
    it('should not call authService.login when form is invalid', () => {
      component.onLogin();
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should call authService.login with form values on valid form', () => {
      authServiceMock.login.mockReturnValue(of(mockAuthResponse));
      component.loginForm.setValue({ email: 'alice@example.com', password: 'secret123' });
      component.onLogin();
      expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'alice@example.com', password: 'secret123' });
    });

    it('should store token in sessionStorage on successful login', fakeAsync(() => {
      authServiceMock.login.mockReturnValue(of(mockAuthResponse));
      component.loginForm.setValue({ email: 'alice@example.com', password: 'secret123' });
      component.onLogin();
      tick();
      expect(sessionStorage.getItem('token')).toBe('jwt-token');
    }));

    it('should navigate to /dashboard on successful login', fakeAsync(() => {
      authServiceMock.login.mockReturnValue(of(mockAuthResponse));
      const navSpy = vi.spyOn(router, 'navigate');
      component.loginForm.setValue({ email: 'alice@example.com', password: 'secret123' });
      component.onLogin();
      tick();
      expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should set errorMessage to "Invalid email or password" on login failure', () => {
      authServiceMock.login.mockReturnValue(throwError(() => ({ status: 401 })));
      component.loginForm.setValue({ email: 'wrong@x.com', password: 'badpass' });
      component.onLogin();
      expect(component.errorMessage).toBe('Invalid email or password');
    });
  });

  // ── onRegister() ──────────────────────────────────────────────────────────

  describe('onRegister()', () => {
    it('should not call authService.register when form is invalid', () => {
      component.onRegister();
      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should call authService.register with form values on valid form', () => {
      authServiceMock.register.mockReturnValue(of(mockAuthResponse));
      component.registerForm.setValue({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
      component.onRegister();
      expect(authServiceMock.register).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
    });

    it('should store token in sessionStorage on successful registration', fakeAsync(() => {
      authServiceMock.register.mockReturnValue(of(mockAuthResponse));
      component.registerForm.setValue({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
      component.onRegister();
      tick();
      expect(sessionStorage.getItem('token')).toBe('jwt-token');
    }));

    it('should navigate to /dashboard on successful registration', fakeAsync(() => {
      authServiceMock.register.mockReturnValue(of(mockAuthResponse));
      const navSpy = vi.spyOn(router, 'navigate');
      component.registerForm.setValue({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
      component.onRegister();
      tick();
      expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should show server error message on registration failure with message', () => {
      authServiceMock.register.mockReturnValue(
        throwError(() => ({ status: 400, error: { message: 'Email already exists' } }))
      );
      component.registerForm.setValue({ name: 'Alice', email: 'used@example.com', password: 'secret123' });
      component.onRegister();
      expect(component.errorMessage).toBe('Email already exists');
    });

    it('should show fallback error message on registration failure without server message', () => {
      authServiceMock.register.mockReturnValue(throwError(() => ({ status: 500, error: {} })));
      component.registerForm.setValue({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
      component.onRegister();
      expect(component.errorMessage).toBe('Registration failed. Please try again.');
    });
  });
});
