import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../../core/services/project/project.service';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectFormComponent } from '../project-form/project-form.component';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.html',
  styleUrls: ['./projects-list.scss'],
  standalone: true,
  imports: [ProjectFormComponent, RouterModule, CommonModule],
})
export class ProjectsListComponent implements OnInit {

  projects = signal<(Project & { tasksCompleted?: number; totalTasks?: number })[]>([]);
  showPopup = signal(false);

  currentProject = signal<Project>({
    id: 0,
    name: '',
    description: '',
    userId: 0
  });

  private isSaving = false;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const userId = this.getUserId();
    if (userId) this.loadProjects(userId);
  }

  private getUserId(): number | null {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user?.id || null;
  }

  loadProjects(ownerId: number) {
    this.projectService.getProjectsByOwner(ownerId)
      .subscribe({
        next: (projectsList) => {
          this.projects.set(projectsList);
          this.loadTasksForProjects(projectsList);
        },
      });
  }

  private loadTasksForProjects(projectsList: Project[]) {
    projectsList.forEach((project) => {
      if (project.id) {
        this.fetchAndUpdateProjectTasks(project);
      }
    });
  }

  private fetchAndUpdateProjectTasks(project: Project) {
    this.taskService.getTasksByProject(project.id!)
      .subscribe({
        next: (tasksList: Task[]) => {

          const updatedProject = {
            ...project,
            totalTasks: tasksList.length,
            tasksCompleted: tasksList.filter((task) => task.status === 'DONE').length
          };

          this.projects.set(
            this.projects().map((projectItem) =>
              projectItem.id === updatedProject.id ? updatedProject : projectItem
            )
          );
        },
      });
  }

  openAddProject() {
    this.currentProject.set({
      id: 0,
      name: '',
      description: '',
      userId: 0
    });

    this.showPopup.set(true);
  }

  openEditProject(project: Project) {
    this.currentProject.set({ ...project });
    this.showPopup.set(true);
  }

  cancel() {
    this.showPopup.set(false);
  }

  private closePopup() {
    this.showPopup.set(false);
  }

  saveProject(project: Project) {
    if (this.isSaving) return;
    this.isSaving = true;

    const userId = this.getUserId();
    if (!userId) {
      this.isSaving = false;
      return;
    }

    const request$ = project.id
      ? this.projectService.updateProject(project.id, project)
      : this.projectService.createProject({ ...project, userId });

    request$.subscribe({
      next: (responseProject) => {

        if (project.id) {
          this.projects.set(
            this.projects().map((projectItem) =>
              projectItem.id === responseProject.id ? responseProject : projectItem
            )
          );
        } else {
          this.projects.set([...this.projects(), responseProject]);
        }

        this.showPopup.set(false);
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  deleteProject(projectId: number) {

    if (!confirm('Are you sure you want to delete this project?')) return;

    this.projectService.deleteProject(projectId)
      .subscribe({
        next: () => {
          this.projects.set(
            this.projects().filter((project) => project.id !== projectId)
          );
        },
      });
  }
}
