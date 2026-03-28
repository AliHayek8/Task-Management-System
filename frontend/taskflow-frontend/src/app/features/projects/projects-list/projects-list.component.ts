import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { ButtonsModule } from '@progress/kendo-angular-buttons';

export interface Project {
  id: number;
  name: string;
  description: string;
  tasksCompleted: number;
  totalTasks: number;
}

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectFormComponent, ButtonsModule],
  templateUrl: './projects-list.html',
  styleUrls: ['./projects-list.scss'],
})
export class ProjectsListComponent {
  projects = signal<Project[]>([
    { id: 1, name: 'Website Redesign', description: 'Revamp the company website', tasksCompleted: 1, totalTasks: 4 },
    { id: 2, name: 'Mobile App MVP', description: 'Build first version of the mobile app', tasksCompleted: 0, totalTasks: 2 },
    { id: 3, name: 'API Integration', description: 'Connect third-party services', tasksCompleted: 2, totalTasks: 3 }
  ]);

  editingProject: WritableSignal<Project | null> = signal(null);
  newProjectMode = signal(false);

  openNewProjectForm() {
    this.newProjectMode.set(true);
    this.editingProject.set({
      id: 0,
      name: '',
      description: '',
      tasksCompleted: 0,
      totalTasks: 0
    });
  }

  editProject(project: Project) {
    this.editingProject.set({ ...project });
    this.newProjectMode.set(false);
  }

  saveProject() {
    const project = this.editingProject();
    if (!project) return;

    if (this.newProjectMode() && (!project.name.trim() && !project.description.trim())) {
      this.cancelEdit();
      return;
    }

    if (this.newProjectMode()) {
      const newId = Math.max(...this.projects().map(p => p.id)) + 1;
      this.projects.set([...this.projects(), { ...project, id: newId }]);
    } else {
      this.projects.set(this.projects().map(p => p.id === project.id ? project : p));
    }

    this.cancelEdit();
  }

  cancelEdit() {
    this.editingProject.set(null);
    this.newProjectMode.set(false);
  }

  deleteProject(project: Project) {
    this.projects.set(this.projects().filter(p => p.id !== project.id));
  }
}