import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
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

  user: User = { name: '', email: '' };
  token: string = '';

  form!: FormGroup;

  fields: FormField[] = [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
  ];

  isSaving = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
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

  saveGeneral(): void {
    if (!this.canSave()) return;

    this.setSaving(true);

    const newName = this.getFormName();

    this.updateName(newName);
  }

  private updateName(name: string): void {
    this.userService.updateName(this.token, name).subscribe({
      next: (res: User) => this.handleSaveSuccess(res),
      error: () => this.handleSaveError()
    });
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

  private canSave(): boolean {
    return !this.form.invalid && !this.isSaving;
  }

  private getFormName(): string {
    return this.form.value.name;
  }

  private patchForm(name: string): void {
    this.form.patchValue({ name });
  }

  private setSaving(state: boolean): void {
    this.isSaving = state;
  }

  cancelEdit(): void {
    this.patchForm(this.user.name);
  }
}
