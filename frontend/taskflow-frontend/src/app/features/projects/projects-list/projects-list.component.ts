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
  showPopup = signal(false);

  currentProject = signal<Project>({
    id: 0,
    name: '',
    description: '',
    userId: 0
  });

  // --- search & filter state ---
  searchQuery  = signal('');
  statusFilter = signal<StatusFilter>('ALL');

  // --- filtered results (auto-updates on every keystroke or filter change) ---
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
        (filter === 'HAS_TASKS' && (project.totalTasks ?? 0) > 0) ||
        (filter === 'COMPLETED' &&
          (project.totalTasks ?? 0) > 0 &&
          project.tasksCompleted === project.totalTasks);

      return matchesSearch && matchesFilter;
    });
  });

  readonly filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL',       label: 'All Projects' },
    { value: 'HAS_TASKS', label: 'Has Tasks'    },
    { value: 'COMPLETED', label: 'Fully Done'   },
  ];

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

  onSearch(value: string)       { this.searchQuery.set(value); }
  onFilterChange(value: string) { this.statusFilter.set(value as StatusFilter); }

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
    projectsList.forEach((project) => {
      if (project.id) this.fetchAndUpdateProjectTasks(project);
    });
  }

  private fetchAndUpdateProjectTasks(project: Project) {
    this.taskService.getTasksByProject(project.id!).subscribe({
      next: (tasksList: Task[]) => {
        const updatedProject = {
          ...project,
          totalTasks:     tasksList.length,
          tasksCompleted: tasksList.filter((task) => task.status === 'DONE').length,
        };
        this.projects.set(
          this.projects().map((p) => p.id === updatedProject.id ? updatedProject : p)
        );
      },
    });
  }

  openAddProject() {
    this.currentProject.set({ id: 0, name: '', description: '', userId: 0 });
    this.showPopup.set(true);
  }

  openEditProject(project: Project) {
    this.currentProject.set({ ...project });
    this.showPopup.set(true);
  }

  cancel() { this.showPopup.set(false); }

  saveProject(project: Project) {
    if (this.isSaving) return;
    this.isSaving = true;

    const userId = this.getUserId();
    if (!userId) { this.isSaving = false; return; }

    const request$ = project.id
      ? this.projectService.updateProject(project.id, project)
      : this.projectService.createProject({ ...project, userId });

    request$.subscribe({
      next: (responseProject) => {
        if (project.id) {
          this.projects.set(
            this.projects().map((p) => p.id === responseProject.id ? responseProject : p)
          );
        } else {
          this.projects.set([...this.projects(), responseProject]);
        }
        this.showPopup.set(false);
        this.isSaving = false;
      },
      error: () => { this.isSaving = false; },
    });
  }

  deleteProject(projectId: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.projects.set(this.projects().filter((p) => p.id !== projectId));
      },
    });
  }
}
