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
  closeForm = input.required<() => void>();

  onSave() {
    this.closeForm()();
  }

  onCancel() {
    this.closeForm()();
  }
}