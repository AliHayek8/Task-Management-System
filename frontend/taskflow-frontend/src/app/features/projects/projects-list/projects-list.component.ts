import { Component, OnInit, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProjectService } from '../../../core/services/project/project.service';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { CommonModule } from '@angular/common';  // 👈 مهم
import { FormsModule } from '@angular/forms';

export interface Project {
  id?: number;      // اختياري
  name: string;
  description: string;
  userId: number;
  tasksCompleted?: number;
  totalTasks?: number;
}

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.html',
  styleUrls: ['./projects-list.scss'],
  standalone: true,
  imports: [CommonModule,           
    FormsModule,           
    ProjectFormComponent],
})
export class ProjectsListComponent implements OnInit {
  projects = signal<Project[]>([]);
  showPopup = signal(false);

  project = signal<Project>({
    id: 0,
    name: '',
    description: '',
    userId: 0
  });

  constructor(
    private projectService: ProjectService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) this.loadProjects(user.id);
  }

  loadProjects(ownerId: number) {
    this.projectService.getProjectsByOwner(ownerId)
      .subscribe({
        next: (data) => this.projects.set(data),
        error: (err) => console.error(err)
      });
  }

  openAddProject() {
    this.project.set({ id: 0, name: '', description: '', userId: 0 });
    this.showPopup.set(true);
  }

 

  cancel() {
    this.showPopup.set(false);
  }


saveProject() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentProject = this.project();
  if (!currentProject.name.trim()) return;

  if (currentProject.id) {
    const { id, ...payload } = currentProject;
    this.projectService.updateProject(id, payload)
      .subscribe({
        next: (updatedProject) => {
          console.log('Updated project response:', updatedProject);
          this.projects.set(
            this.projects().map(p => p.id === updatedProject.id ? updatedProject : p)
          );
          this.showPopup.set(false);
        },
        error: (err) => console.error('Update project error:', err)
      });
  } else {
    const newProject = { ...currentProject, userId: user.id };
    this.projectService.createProject(newProject)
      .subscribe({
        next: (createdProject) => {
          console.log('Created project response:', createdProject);
          this.projects.set([...this.projects(), createdProject]);
          this.showPopup.set(false);
        },
        error: (err) => console.error('Create project error:', err)
      });
  }
}
openEditProject(p: Project) {
  console.log('Editing project:', p);
  this.project.set({ ...p });
  this.showPopup.set(true);
}

deleteProject(id: number) {
  console.log('Deleting project with id:', id);
  if (!confirm('Are you sure you want to delete this project?')) return;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  this.projectService.deleteProject(id)
    .subscribe({
      next: () => {
        console.log('Deleted successfully');
        this.loadProjects(user.id);
      },
      error: (err) => console.error('Delete error:', err)
    });
}
}