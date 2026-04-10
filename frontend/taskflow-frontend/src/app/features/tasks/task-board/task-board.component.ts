import {Component,OnInit,signal,computed,PLATFORM_ID,ChangeDetectorRef,inject,} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';

import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectService } from '../../../core/services/project/project.service';
import { TaskFormComponent } from '../task-form/task-form.component';
import {getPriorityColor,getSessionUser,GLOBAL_ERROR_DISMISS_MS,TASK_STATUSES,} from './task-board.utils';

type PriorityFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonsModule, TaskFormComponent],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss',
})
export class TaskBoard implements OnInit {

  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly taskService    = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly platformId     = inject(PLATFORM_ID);

  projectId!: number;
  projectName  = '';

  tasks = signal<Task[]>([]);

  searchQuery     = signal('');
  priorityFilter  = signal<PriorityFilter>('ALL');

  filteredTasks = computed(() => {
    const query    = this.searchQuery().trim().toLowerCase();
    const priority = this.priorityFilter();

    return this.tasks().filter(task => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.assigneeName ?? '').toLowerCase().includes(query) ||
        (task.assigneeEmail ?? '').toLowerCase().includes(query);

      const matchesPriority =
        priority === 'ALL' || task.priority === priority;

      return matchesSearch && matchesPriority;
    });
  });

  filteredByStatus = (status: string): Task[] =>
    this.filteredTasks().filter(task => task.status === status);

  showDialog   = signal(false);
  isEditMode   = signal(false);
  selectedTask = signal<Task | null>(null);
  isLoading    = signal(false);
  globalTaskError = '';

  readonly getPriorityColor  = getPriorityColor;
  readonly TASK_STATUSES     = TASK_STATUSES;

  readonly priorityOptions: { value: PriorityFilter; label: string }[] = [
    { value: 'ALL',    label: 'All Priorities' },
    { value: 'HIGH',   label: '🔴 High'        },
    { value: 'MEDIUM', label: '🟠 Medium'      },
    { value: 'LOW',    label: '🟢 Low'         },
  ];

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId')) || 1;

    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
      this.loadProjectName();
    }
  }

  onSearch(value: string)         { this.searchQuery.set(value); }
  onPriorityChange(value: string) { this.priorityFilter.set(value as PriorityFilter); }

  loadProjectName(): void {
    const user = getSessionUser();
    if (!user?.id) return;

    this.projectService.getProjectsByOwner(user.id).subscribe({
      next: (projects) => {
        const match = projects.find(p => p.id === this.projectId);
        if (match) this.projectName = match.name;
      },
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasks) => { this.tasks.set(tasks); this.isLoading.set(false); },
      error: ()      => { this.isLoading.set(false); },
    });
  }

  goBackToProjects(): void {
    this.router.navigate(['/projects']);
  }

  openAddDialog(status: string = TASK_STATUSES.TODO): void {
    this.isEditMode.set(false);
    this.selectedTask.set({ ...this.getEmptyTask(), status: status as Task['status'] });
    this.showDialog.set(true);
  }

  openEditDialog(task: Task): void {
    this.isEditMode.set(true);
    this.selectedTask.set({ ...task });
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.selectedTask.set(null);
  }

  onTaskSaved(savedTask: Task): void {
    if (this.isEditMode()) {
      this.tasks.set(this.tasks().map(t => t.id === savedTask.id ? savedTask : t));
    } else {
      this.tasks.set([...this.tasks(), savedTask]);
    }
    this.closeDialog();
  }

  deleteTask(task: Task): void {
    this.taskService.deleteTask(task.id!).subscribe({
      next: () => { this.tasks.set(this.tasks().filter(t => t.id !== task.id)); },
      error: () => {
        this.globalTaskError = 'Could not delete the task. Please try again.';
        setTimeout(() => (this.globalTaskError = ''), GLOBAL_ERROR_DISMISS_MS);
        this.cdr.detectChanges();
      },
    });
  }

  changeStatus(task: Task, newStatus: string): void {
    if (
      task.status === TASK_STATUSES.TODO &&
      newStatus  === TASK_STATUSES.IN_PROGRESS &&
      !task.assigneeEmail
    ) {
      this.globalTaskError = '⚠️ Please assign this task to someone before moving it to In Progress';
      setTimeout(() => (this.globalTaskError = ''), GLOBAL_ERROR_DISMISS_MS);
      return;
    }

    this.taskService.updateTaskStatus(task.id!, newStatus).subscribe({
      next: (updated) => {
        this.tasks.set(this.tasks().map(t => t.id === updated.id ? updated : t));
      },
      error: () => {
        this.globalTaskError = 'Could not update task status. Please try again.';
        setTimeout(() => (this.globalTaskError = ''), GLOBAL_ERROR_DISMISS_MS);
        this.cdr.detectChanges();
      },
    });
  }

  private getEmptyTask(): Task {
    return {
      id: undefined,
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeEmail: '',
      deadline: '',
      projectId: this.projectId || 1,
    };
  }
}
