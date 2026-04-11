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
  tasks        = signal<Task[]>([]);
  showDialog   = signal(false);
  isEditMode   = signal(false);
  selectedTask = signal<Task | null>(null);
  isLoading    = signal(false);
  globalTaskError = '';
  draggedTask: Task | null = null;

  searchQuery    = signal('');
  priorityFilter = signal<PriorityFilter>('ALL');

  filteredTasks = computed(() => {
    const query    = this.searchQuery().trim().toLowerCase();
    const priority = this.priorityFilter();

    return this.tasks().filter(task => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.assigneeName  ?? '').toLowerCase().includes(query) ||
        (task.assigneeEmail ?? '').toLowerCase().includes(query);

      const matchesPriority =
        priority === 'ALL' || task.priority === priority;

      return matchesSearch && matchesPriority;
    });
  });

  filteredByStatus = (status: string): Task[] =>
    this.filteredTasks().filter(task => task.status === status);

  readonly getPriorityColor = getPriorityColor;
  readonly TASK_STATUSES    = TASK_STATUSES;

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
        const matchedProject = projects.find(p => p.id === this.projectId);
        if (matchedProject) this.projectName = matchedProject.name;
      },
      error: (err) => { console.error('Failed to load project name:', err); },
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasks) => { this.tasks.set(tasks); this.isLoading.set(false); },
      error: (err)  => { console.error('Failed to load tasks:', err); this.isLoading.set(false); },
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
      next: () => {
        this.tasks.set(this.tasks().filter(t => t.id !== task.id));
      },
      error: (err) => {
        console.error('Failed to delete task:', err);
        this.showErrorMessage('Could not delete the task. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  changeStatus(task: Task, newStatus: string): void {
    if (this.isInvalidStatusChange(task, newStatus)) {
      this.showErrorMessage('⚠️ Please assign this task to someone before moving it to In Progress');
      return;
    }

    this.taskService.updateTaskStatus(task.id!, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks.set(this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t));
      },
      error: (err) => {
        console.error('Failed to update task status:', err);
        this.showErrorMessage('Could not update task status. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }


  onDragStart(task: Task): void {
    this.draggedTask = task;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(newStatus: string): void {
    if (!this.draggedTask) return;

    const draggedTask = this.draggedTask;

    if (this.isInvalidStatusChange(draggedTask, newStatus)) {
      this.showErrorMessage('⚠️ Please assign this task before moving it to In Progress');
      this.clearDraggedTask();
      return;
    }

    if (this.isSameStatus(draggedTask, newStatus)) {
      this.clearDraggedTask();
      return;
    }

    this.updateTaskStatus(draggedTask, newStatus);
  }


  private isInvalidStatusChange(task: Task, newStatus: string): boolean {
    const movingToRestrictedStatus =
      newStatus === TASK_STATUSES.IN_PROGRESS ||
      newStatus === TASK_STATUSES.DONE;

    return movingToRestrictedStatus && !task.assigneeEmail;
  }
  private isSameStatus(task: Task, newStatus: string): boolean {
    return task.status === newStatus;
  }

  private clearDraggedTask(): void {
    this.draggedTask = null;
  }

  private showErrorMessage(message: string): void {
    this.globalTaskError = message;
    setTimeout(() => { this.globalTaskError = ''; }, GLOBAL_ERROR_DISMISS_MS);
  }

  private updateTaskStatus(task: Task, newStatus: string): void {
    this.taskService.updateTaskStatus(task.id!, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks.set(this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t));
        this.clearDraggedTask();
      },
      error: (error) => {
        console.error('Failed to update task status:', error);
        this.showErrorMessage('Could not update task status. Please try again.');
        this.clearDraggedTask();
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
