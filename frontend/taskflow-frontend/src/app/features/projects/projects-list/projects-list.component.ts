import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project/project.service';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectFormComponent } from '../project-form/project-form.component';

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
  imports: [FormsModule, ProjectFormComponent, RouterModule,CommonModule],
})
export class ProjectsListComponent implements OnInit {
  projects = signal<Project[]>([]);
  showPopup = signal(false);

  currentProject = signal<Project>({
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
        next: (projectsList) => {
          this.projects.set(projectsList);

          projectsList.forEach(project => {
            if (project.id) {
              this.taskService.getTasksByProject(project.id).subscribe({
                next: (tasksList: Task[]) => {
                  const updatedProject: Project = {
                    ...project,
                    totalTasks: tasksList.length,
                    tasksCompleted: tasksList.filter(task => task.status === 'DONE').length
                  };

                  this.projects.set(
                    this.projects().map(project =>
                      project.id === updatedProject.id ? updatedProject : project
                    )
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
    this.currentProject.set({ id: 0, name: '', description: '', userId: 0 });
    this.showPopup.set(true);
  }

  openEditProject(projectToEdit: Project) {
    this.currentProject.set({ ...projectToEdit });
    this.showPopup.set(true);
  }

  cancel() {
    this.showPopup.set(false);
  }

  saveProject() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!user?.id) return;

    const projectToSave = this.currentProject();

    if (projectToSave.id) {
      const { id, ...payload } = projectToSave;
      this.projectService.updateProject(id, payload).subscribe({
        next: (updatedProject) => {
          this.projects.set(
            this.projects().map(proj =>
              proj.id === updatedProject.id ? updatedProject : proj
            )
          );
          this.showPopup.set(false);
        },
        error: (err) => console.error(err)
      });
    } else {
      const newProject = { ...projectToSave, userId: user.id };
      this.projectService.createProject(newProject).subscribe({
        next: (createdProject) => {
          this.projects.set([...this.projects(), createdProject]);
          this.showPopup.set(false);
        },
        error: (err) => console.error(err)
      });
    }
  }

  deleteProject(projectId: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.projects.set(this.projects().filter(project => project.id !== projectId));
      },
      error: (err) => console.error(err)
    });
  }
}
