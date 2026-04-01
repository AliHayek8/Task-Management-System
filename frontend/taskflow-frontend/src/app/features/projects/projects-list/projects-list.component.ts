import { Component, OnInit, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProjectService } from '../../../core/services/project/project.service';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectFormComponent } from '../project-form/project-form.component';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Project {
  id?: number;
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
  imports: [FormsModule, ProjectFormComponent, RouterModule],
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
    private taskService: TaskService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user?.id) this.loadProjects(user.id);
  }

  loadProjects(ownerId: number) {
    this.projectService.getProjectsByOwner(ownerId)
      .subscribe({
        next: (data) => {
          // ضع المشاريع في الـ signal
          this.projects.set(data);

          // لكل مشروع، اجلب الكاردات وعدد الـ DONE
          data.forEach(project => {
            if (project.id) {
              this.taskService.getTasksByProject(project.id).subscribe({
                next: (tasks: Task[]) => {
                  const updatedProject: Project = {
                    ...project,
                    totalTasks: tasks.length,
                    tasksCompleted: tasks.filter(t => t.status === 'DONE').length
                  };

                  // تحديث الـ projects signal
                  this.projects.set(
                    this.projects().map(p => p.id === updatedProject.id ? updatedProject : p)
                  );
                },
                error: (err) => console.error(err)
              });
            }
          });
        },
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
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user?.id) this.loadProjects(user.id);

    const currentProject = this.project();

    if (currentProject.id) {
      const { id, ...payload } = currentProject;
      this.projectService.updateProject(id, payload).subscribe({
        next: (updatedProject) => {
          this.projects.set(
            this.projects().map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          );
          this.showPopup.set(false);
        },
        error: (err) => console.error(err)
      });
    } else {
      const newProject = { ...currentProject, userId: user.id };
      this.projectService.createProject(newProject).subscribe({
        next: (createdProject) => {
          this.projects.set([...this.projects(), createdProject]);
          this.showPopup.set(false);
        },
        error: (err) => console.error(err)
      });
    }
  }

  openEditProject(p: Project) {
    this.project.set({ ...p });
    this.showPopup.set(true);
  }

  deleteProject(id: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user?.id) this.loadProjects(user.id);

    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.loadProjects(user.id);
      },
      error: (err) => console.error(err)
    });
  }
}
