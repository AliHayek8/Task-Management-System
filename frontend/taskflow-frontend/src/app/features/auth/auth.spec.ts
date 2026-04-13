import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { PLATFORM_ID, Component } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { vi } from 'vitest';

@Component({ standalone: true, template: '' })
class DashboardStubComponent {}

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authServiceMock: any;
  let router: Router;

  const mockAuthResponse = {
    id: 1,
    token: 'jwt-token',
    name: 'Alice Smith',
    email: 'alice@example.com'
  };

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        AuthComponent,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: DashboardStubComponent },
        ]),
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();

    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start in login mode', () => {
    expect(component.isLoginMode).toBe(true);
  });

  describe('onLogin()', () => {
    it('should store token in sessionStorage on successful login', async () => {
      authServiceMock.login.mockReturnValue(of(mockAuthResponse));

      component.loginForm.setValue({
        email: 'alice@example.com',
        password: 'secret123'
      });

      component.onLogin();

      expect(sessionStorage.getItem('token')).toBe('jwt-token');
    });

    it('should navigate to /dashboard on successful login', async () => {
      authServiceMock.login.mockReturnValue(of(mockAuthResponse));
      const navSpy = vi.spyOn(router, 'navigate');

      component.loginForm.setValue({
        email: 'alice@example.com',
        password: 'secret123'
      });

      component.onLogin();

      expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('onRegister()', () => {
    it('should store token in sessionStorage on successful registration', async () => {
      authServiceMock.register.mockReturnValue(of(mockAuthResponse));

      component.registerForm.setValue({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123'
      });

      component.onRegister();

      expect(sessionStorage.getItem('token')).toBe('jwt-token');
    });

    it('should navigate to /dashboard on successful registration', async () => {
      authServiceMock.register.mockReturnValue(of(mockAuthResponse));
      const navSpy = vi.spyOn(router, 'navigate');

      component.registerForm.setValue({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123'
      });

      component.onRegister();

      expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});

