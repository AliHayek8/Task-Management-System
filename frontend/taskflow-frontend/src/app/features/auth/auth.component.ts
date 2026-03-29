import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class AuthComponent {
  isLoginMode = true;

  loginData = { email: '', password: '' };

  registerData = { name: '', email: '', password: '' };

  errorMessage = '';

  registerErrors = {
    name: '',
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.registerErrors = { name: '', email: '', password: '' };
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
    console.log('Login clicked!', this.loginData);

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }


    this.authService.login(this.loginData).subscribe({
      next: (response: any) => {
        console.log('Login success!', response);
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('user', JSON.stringify({
          name: response.name,
          email: response.email
        }));
        this.router.navigate(['/dashboard']);
      },

      error: (err: any) => {
        console.log('Login error details:', err.error);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Invalid email or password';
        }
      }
    });
  }

  onRegister() {
    this.validateName();
    this.validateEmail();
    this.validatePassword();

    if (!this.isRegisterFormValid()) {
      return;
    }

    this.authService.register(this.registerData).subscribe({

      next: (response: any) => {
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('user', JSON.stringify({
          name: response.name,
          email: response.email
        }));
        this.router.navigate(['/dashboard']);
      },

      error: (err: any) => {
        console.log('Register error details:', err.error);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }
}
