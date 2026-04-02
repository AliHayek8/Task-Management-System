import { Component, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterModule,CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class AuthComponent {
  isLoginMode = true;

  loginData = { email: '', password: '' };
  registerData = { name: '', email: '', password: '' };

  errorMessage = '';

  loginErrors = {
    email: '',
    password: ''
  };

  registerErrors = {
    name: '',
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.registerErrors = { name: '', email: '', password: '' };
    this.loginErrors = { email: '', password: '' };
  }


  validateLoginEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.loginData.email) {
      this.loginErrors.email = 'Email is required';
    } else if (!emailRegex.test(this.loginData.email)) {
      this.loginErrors.email = 'Please enter a valid email';
    } else {
      this.loginErrors.email = '';
    }
  }

  validateLoginPassword() {
    if (!this.loginData.password) {
      this.loginErrors.password = 'Password is required';
    } else {
      this.loginErrors.password = '';
    }
  }

  isLoginFormValid(): boolean {
    this.validateLoginEmail();
    this.validateLoginPassword();
    return !this.loginErrors.email && !this.loginErrors.password;
  }


  validateName() {
    if (!this.registerData.name.trim()) {
      this.registerErrors.name = 'Name is required';
    } else {
      this.registerErrors.name = '';
    }
  }

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.registerData.email) {
      this.registerErrors.email = 'Email is required';
    } else if (!emailRegex.test(this.registerData.email)) {
      this.registerErrors.email = 'Please enter a valid email (e.g. ali@example.com)';
    } else {
      this.registerErrors.email = '';
    }
  }

  validatePassword() {
    if (!this.registerData.password) {
      this.registerErrors.password = 'Password is required';
    } else if (this.registerData.password.length < 6) {
      this.registerErrors.password = 'Password must be at least 6 characters';
    } else {
      this.registerErrors.password = '';
    }
  }

  isRegisterFormValid(): boolean {
    return !this.registerErrors.name &&
           !this.registerErrors.email &&
           !this.registerErrors.password &&
           !!this.registerData.name &&
           !!this.registerData.email &&
           !!this.registerData.password;
  }


  onLogin() {
    if (!this.isLoginFormValid()) {
      this.cdr.detectChanges();
      return;
    }

    this.authService.login(this.loginData).subscribe({
      next: (response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify({
            id: response.id,
            name: response.name,
            email: response.email
          }));
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = 'Invalid email or password';
        this.cdr.detectChanges();
      }
    });
  }


  onRegister() {
    this.validateName();
    this.validateEmail();
    this.validatePassword();

    // لا نرسل request إذا فيه أخطاء
    if (!this.isRegisterFormValid()) {
      this.cdr.detectChanges();
      return;
    }

    this.authService.register(this.registerData).subscribe({
      next: (response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify({
            id: response.id,
            name: response.name,
            email: response.email
          }));
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
