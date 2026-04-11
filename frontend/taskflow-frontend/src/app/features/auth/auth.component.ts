import { Component, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { DynamicFormComponent, FormField } from '../shared-form/dynamic-form.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DynamicFormComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  errorMessage = '';

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  loginFields: FormField[] = [
    { name: 'email',    label: 'Email',    type: 'email',    required: true, placeholder: 'Enter your email' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter your password',
      submitOnEnter: true },
  ];

  registerFields: FormField[] = [
    { name: 'name',     label: 'Full Name', type: 'text',     required: true, placeholder: 'Enter your name' },
    { name: 'email',    label: 'Email',     type: 'email',    required: true, placeholder: 'Enter your email' },
    { name: 'password', label: 'Password',  type: 'password', required: true, placeholder: 'Enter your password',
      hint: '(min 6 characters)', submitOnEnter: true },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onLogin() {
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify({
            id: response.id,
            name: response.name,
            email: response.email,
          }));
        }
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Invalid email or password';
        this.cdr.detectChanges();
      },
    });
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    this.authService.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify({
            id: response.id,
            name: response.name,
            email: response.email,
          }));
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message ?? 'Registration failed. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }
}
