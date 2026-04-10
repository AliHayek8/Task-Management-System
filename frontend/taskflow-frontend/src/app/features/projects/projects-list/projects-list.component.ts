import { Component, Inject, OnInit, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../../core/services/project/project.service';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectFormComponent } from '../project-form/project-form.component';

type ProjectWithTasks = Project & { tasksCompleted?: number; totalTasks?: number };
type StatusFilter = 'ALL' | 'HAS_TASKS' | 'COMPLETED';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.html',
  styleUrls: ['./projects-list.scss'],
  standalone: true,
  imports: [FormsModule, ProjectFormComponent, RouterModule, CommonModule],
})
export class ProjectsListComponent implements OnInit {

  projects = signal<ProjectWithTasks[]>([]);

  searchQuery  = signal('');
  statusFilter = signal<StatusFilter>('ALL');

  filteredProjects = computed(() => {
    const query  = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();

    return this.projects().filter(project => {
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        (project.description ?? '').toLowerCase().includes(query);

      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'HAS_TASKS'  && (project.totalTasks ?? 0) > 0) ||
        (filter === 'COMPLETED'  && (project.totalTasks ?? 0) > 0 &&
          project.tasksCompleted === project.totalTasks);

      return matchesSearch && matchesFilter;
    });
  });

  showPopup = signal(false);

  currentProject = signal<Project>({
    id: 0,
    name: '',
    description: '',
    userId: 0
  });

  readonly filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL',        label: 'All Projects' },
    { value: 'HAS_TASKS',  label: 'Has Tasks'    },
    { value: 'COMPLETED',  label: 'Fully Done'   },
  ];

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

  onSearch(value: string)       { this.searchQuery.set(value); }
  onFilterChange(value: string) { this.statusFilter.set(value as StatusFilter); }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getUserId(): number | null {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user?.id || null;
  }

  loadProjects(ownerId: number) {
    this.projectService.getProjectsByOwner(ownerId).subscribe({
      next: (projectsList) => {
        this.projects.set(projectsList);
        this.loadTasksForProjects(projectsList);
      },
    });
  }

  private loadTasksForProjects(projectsList: Project[]) {
    projectsList.forEach(project => {
      if (project.id) this.fetchAndUpdateProjectTasks(project);
    });
  }

  private fetchAndUpdateProjectTasks(project: Project) {
    this.taskService.getTasksByProject(project.id!).subscribe({
      next: (tasksList: Task[]) => {
        const updatedProject = this.mapProjectWithTasks(project, tasksList);
        this.updateProjectInList(updatedProject);
      },
    });
  }

  private mapProjectWithTasks(project: Project, tasks: Task[]): ProjectWithTasks {
    return {
      ...project,
      totalTasks:     tasks.length,
      tasksCompleted: tasks.filter(t => t.status === 'DONE').length,
    };
  }

  private updateProjectInList(updated: ProjectWithTasks) {
    this.projects.set(
      this.projects().map(p => p.id === updated.id ? updated : p)
    );
  }

  openAddProject() {
    this.currentProject.set({ id: 0, name: '', description: '', userId: 0 });
    this.showPopup.set(true);
  }

  openEditProject(project: ProjectWithTasks) {
    this.currentProject.set({ ...project });
    this.showPopup.set(true);
  }

  cancel() { this.showPopup.set(false); }

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

  private updateExistingProject(project: ProjectWithTasks) {
    const { id, tasksCompleted, totalTasks, ...payload } = project;
    this.projectService.updateProject(id!, payload).subscribe({
      next: (updated) => { this.updateProjectInList(updated); this.showPopup.set(false); },
    });
  }

  private createNewProject(project: ProjectWithTasks, userId: number) {
    const { tasksCompleted, totalTasks, ...payload } = project;
    this.projectService.createProject({ ...payload, userId }).subscribe({
      next: (created) => { this.projects.set([...this.projects(), created]); this.showPopup.set(false); },
    });
  }

  deleteProject(projectId: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    this.projectService.deleteProject(projectId).subscribe({
      next: () => { this.projects.set(this.projects().filter(p => p.id !== projectId)); },
    });
  }
}
