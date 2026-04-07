import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../../core/services/project/project.service';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectFormComponent } from '../project-form/project-form.component';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.html',
  styleUrls: ['./projects-list.scss'],
  standalone: true,
  imports: [FormsModule, ProjectFormComponent, RouterModule, CommonModule],
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

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!this.isBrowser()) return;

    const userId = this.getUserId();
    if (userId) this.loadProjects(userId);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
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
    projectsList.forEach(project => {
      if (project.id) {
        this.fetchAndUpdateProjectTasks(project);
      }
    });
  }

  private fetchAndUpdateProjectTasks(project: Project) {
    this.taskService.getTasksByProject(project.id!)
      .subscribe({
        next: (tasksList: Task[]) => {
          const updatedProject = this.mapProjectWithTasks(project, tasksList);
          this.updateProjectInList(updatedProject);
        },
      });
  }

  private mapProjectWithTasks(project: Project, tasks: Task[]) {
    return {
      ...project,
      totalTasks: tasks.length,
      tasksCompleted: tasks.filter(t => t.status === 'DONE').length
    };
  }

  private updateProjectInList(updatedProject: Project & { tasksCompleted?: number; totalTasks?: number }) {
    this.projects.set(
      this.projects().map(p =>
        p.id === updatedProject.id ? updatedProject : p
      )
    );
  }

  openAddProject() {
    this.currentProject.set({ id: 0, name: '', description: '', userId: 0 });
    this.showPopup.set(true);
  }

  openEditProject(projectToEdit: Project & { tasksCompleted?: number; totalTasks?: number }) {
    this.currentProject.set({ ...projectToEdit });
    this.showPopup.set(true);
  }

  cancel() {
    this.showPopup.set(false);
  }

  private closePopup() {
    this.showPopup.set(false);
  }

  saveProject() {
    const userId = this.getUserId();
    if (!userId) return;

    const project = this.currentProject();

    if (project.id) {
      this.updateExistingProject(project as any);
    } else {
      this.createNewProject(project as any, userId);
    }
  }

  private updateExistingProject(project: Project & { tasksCompleted?: number; totalTasks?: number }) {
    const { id, tasksCompleted, totalTasks, ...payload } = project;

    this.projectService.updateProject(id!, payload)
      .subscribe({
        next: (updatedProject) => {
          this.updateProjectInList(updatedProject);
          this.closePopup();
        },
      });
  }

  private createNewProject(project: Project & { tasksCompleted?: number; totalTasks?: number }, userId: number) {
    const { tasksCompleted, totalTasks, ...payload } = project;
    const newProject = { ...payload, userId };

    this.projectService.createProject(newProject)
      .subscribe({
        next: (createdProject) => {
          this.projects.set([...this.projects(), createdProject]);
          this.closePopup();
        },
      });
  }

  deleteProject(projectId: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    this.projectService.deleteProject(projectId)
      .subscribe({
        next: () => {
          this.projects.set(
            this.projects().filter(project => project.id !== projectId)
          );
        },
      });
  }
}
