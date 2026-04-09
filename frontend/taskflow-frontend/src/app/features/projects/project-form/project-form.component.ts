import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {CommonModule} from '@angular/common';
import { Project } from '../../../core/services/project/project.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './project-form.html',
  styleUrls: ['./project-form.scss'],
})
export class ProjectFormComponent {
  project = input.required<Project>();
  isNewProject = input.required<boolean>();

  save = output<void>();
  cancel = output<void>();

  descriptionError = false;

  checkDescription(value: string) {
    this.descriptionError = !!value && value.trim().length < 30;
  }

  onSave(form: any) {
    if (form.invalid || this.descriptionError) {
      form.control.markAllAsTouched();
      return;
    }

    this.save.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
