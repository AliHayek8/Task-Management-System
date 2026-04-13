import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User } from '../../core/services/user/user.service';
import { DynamicFormComponent, FormField } from '../shared-form/dynamic-form.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DynamicFormComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);


  user: User = { name: '', email: '' };
  token = '';
  form!: FormGroup;

  isSaving = false;

  fields: FormField[] = [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initToken();
    this.initUserFromStorage();
    this.initForm();
    this.fetchUser();
  }


  private initToken(): void {
    this.token = sessionStorage.getItem('token') || '';
  }

  private initUserFromStorage(): void {
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [this.user.name, Validators.required]
    });
  }

  fetchUser(): void {
    if (!this.token) return;

    this.userService.getProfile(this.token).subscribe({
      next: (res) => this.handleFetchSuccess(res),
    });
  }

  private updateName(name: string): void {
    this.userService.updateName(this.token, name).subscribe({
      next: (res: User) => this.handleSaveSuccess(res),
      error: () => this.handleSaveError()
    });
  }

  saveGeneral(): void {
    if (this.form.invalid || this.isSaving) return;

    this.setSaving(true);

    const name = this.form.value.name;
    this.updateName(name);
  }

  cancelEdit(): void {
    this.form.patchValue({ name: this.user.name });
  }


  private handleFetchSuccess(res: User): void {
    this.user = res;
    this.patchForm(res.name);
    this.userService.setCurrentUser(res);
  }

  private handleSaveSuccess(res: User): void {
    this.user = res;

    this.patchForm(res.name);
    this.userService.setCurrentUser(res);

    alert('Profile updated successfully!');

    this.setSaving(false);
  }

  private handleSaveError(): void {
    this.setSaving(false);
  }


  private patchForm(name: string): void {
    this.form.patchValue({ name });
  }

  private setSaving(state: boolean): void {
    this.isSaving = state;
  }
}
