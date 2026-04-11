import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'password' | 'select' | 'date';
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: SelectOption[];
  requiredIf?: (form: FormGroup) => boolean;
  submitOnEnter?: boolean;
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
  submitLabel = input<string>('Save');
  showCancel = input<boolean>(true);

  alignment = input<'left' | 'center' | 'right'>('right');

  submit = output<void>();
  cancel = output<void>();

  isFieldRequired(field: FormField): boolean {
    if (field.requiredIf) return field.requiredIf(this.form());
    return !!field.required;
  }

  onSubmit() {
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }
    this.submit.emit();
  }
}
