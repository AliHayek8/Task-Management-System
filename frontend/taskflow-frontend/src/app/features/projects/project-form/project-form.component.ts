import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project } from '../projects-list/projects-list.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-form.html',
  styleUrls: ['./project-form.scss'],
})
export class ProjectFormComponent {
  project = input.required<Project>();
  isNewProject = input.required<boolean>();
  save = input.required<() => void>();
  cancel = input.required<() => void>();

  descriptionError = false;

 checkDescription(value: string) {
   this.descriptionError = !!value && value.trim().length < 30;
 }

  onSave(form: any) {
    if (form.invalid || this.descriptionError) {
      form.control.markAllAsTouched();
      return;
    }

    this.save()();
  }

  onCancel() {
    this.cancel()();
  }
}
