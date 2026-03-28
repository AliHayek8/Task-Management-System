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

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  onLogin() {
    console.log('Login clicked!', this.loginData);
    this.authService.login(this.loginData).subscribe({
      next: (response: any) => {
        console.log('Login success!', response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          name: response.name,
          email: response.email
        }));
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        console.log('Login error!', err);
        this.errorMessage = 'Invalid email or password';
      }
    });
  }

  onRegister() {
    this.authService.register(this.registerData).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          name: response.name,
          email: response.email
        }));
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Registration failed. Email may already exist.';
      }
    });
  }
}
