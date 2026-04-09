import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'email';
  required?: boolean;
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-form.html',
  styleUrls: ['./dynamic-form.scss'],
})
export class DynamicFormComponent {
  form = input.required<FormGroup>();
  fields = input.required<FormField[]>();

  submit = output<void>();
  cancel = output<void>();

  onSubmit() {
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }

    this.submit.emit();
  }
}
