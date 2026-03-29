import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      register: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        AuthComponent,
        CommonModule,
        FormsModule,
        RouterModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in login mode', () => {
    expect(component.isLoginMode).toBe(true);
  });

  it('should toggle between login and register mode', () => {
    expect(component.isLoginMode).toBe(true);
    component.toggleMode();
    expect(component.isLoginMode).toBe(false);
    component.toggleMode();
    expect(component.isLoginMode).toBe(true);
  });

  it('should clear error message when toggling mode', () => {
    component.errorMessage = 'Some error';
    component.toggleMode();
    expect(component.errorMessage).toBe('');
  });

  it('should navigate to dashboard on successful login', () => {
    const mockResponse = {
      token: 'fake-token',
      name: 'Ali',
      email: 'ali@example.com'
    };

    authServiceMock.login.mockReturnValue(of(mockResponse));

    component.loginData = { email: 'ali@example.com', password: '123456' };
    component.onLogin();

    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on failed login', () => {
    authServiceMock.login.mockReturnValue(throwError(() => new Error('Unauthorized')));

    component.loginData = { email: 'wrong@example.com', password: 'wrongpass' };
    component.onLogin();

    expect(component.errorMessage).toBe('Invalid email or password');
  });

  it('should navigate to dashboard on successful register', () => {
    const mockResponse = {
      token: 'fake-token',
      name: 'Ali',
      email: 'ali@example.com'
    };

    authServiceMock.register.mockReturnValue(of(mockResponse));

    component.registerData = {
      name: 'Ali',
      email: 'ali@example.com',
      password: '123456'
    };
    component.onRegister();

    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on failed register', () => {
    authServiceMock.register.mockReturnValue(throwError(() => new Error('Email exists')));

    component.registerData = {
      name: 'Ali',
      email: 'existing@example.com',
      password: '123456'
    };
    component.onRegister();

    expect(component.errorMessage).toBe('Registration failed. Please try again.');
  });
});
