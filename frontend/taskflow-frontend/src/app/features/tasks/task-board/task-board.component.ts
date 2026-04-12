import {Component, OnInit, signal, computed, PLATFORM_ID, ChangeDetectorRef, inject,} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectService } from '../../../core/services/project/project.service';
import { TaskFormComponent } from '../task-form/task-form.component';
import {getPriorityColor, getSessionUser, GLOBAL_ERROR_DISMISS_MS, TASK_STATUSES,} from './task-board.utils';

type PriorityFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonsModule, TaskFormComponent],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss',
})
export class TaskBoard implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  projectId!: number;
  projectName = '';

  tasks = signal<Task[]>([]);
  showDialog = signal(false);
  isEditMode = signal(false);
  selectedTask = signal<Task | null>(null);
  isLoading = signal(false);

  globalTaskError = '';
  draggedTask: Task | null = null;

  searchQuery = signal('');
  priorityFilter = signal<PriorityFilter>('ALL');

  filteredTasks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const priority = this.priorityFilter();

    return this.tasks().filter(taskItem => {

      const matchesSearch =
        !query ||
        taskItem.title.toLowerCase().includes(query) ||
        (taskItem.assigneeName ?? '').toLowerCase().includes(query) ||
        (taskItem.assigneeEmail ?? '').toLowerCase().includes(query);

      const matchesPriority =
        priority === 'ALL' || taskItem.priority === priority;

      return matchesSearch && matchesPriority;
    });
  });

  filteredByStatus = (status: string): Task[] =>
    this.filteredTasks().filter(taskItem => taskItem.status === status);

  readonly getPriorityColor = getPriorityColor;
  readonly TASK_STATUSES = TASK_STATUSES;

  readonly priorityOptions: { value: PriorityFilter; label: string }[] = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'HIGH', label: '🔴 High' },
    { value: 'MEDIUM', label: '🟠 Medium' },
    { value: 'LOW', label: '🟢 Low' },
  ];

  ngOnInit(): void {
    this.projectId =
      Number(this.route.snapshot.paramMap.get('projectId')) || 1;

    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
      this.loadProjectName();
    }
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
  }

  onPriorityChange(value: string) {
    this.priorityFilter.set(value as PriorityFilter);
  }

  loadProjectName(): void {
    const sessionUser = getSessionUser();

    if (!sessionUser?.id) return;

    this.projectService.getProjectsByOwner(sessionUser.id).subscribe({
      next: (projectsList) => {

        const matchedProject = projectsList.find(
          projectItem => projectItem.id === this.projectId
        );

        if (matchedProject) {
          this.projectName = matchedProject.name;
        }
      },
      error: (error) => {
        console.error('Failed to load project name:', error);
      },
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);

    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasksList) => {
        this.tasks.set(tasksList);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load tasks:', error);
        this.isLoading.set(false);
      },
    });
  }

  goBackToProjects(): void {
    this.router.navigate(['/projects']);
  }

  openAddDialog(status: string = TASK_STATUSES.TODO): void {
    this.isEditMode.set(false);

    this.selectedTask.set({
      ...this.getEmptyTask(),
      status: status as Task['status'],
    });

    this.showDialog.set(true);
  }

  openEditDialog(taskItem: Task): void {
    this.isEditMode.set(true);
    this.selectedTask.set({ ...taskItem });
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.selectedTask.set(null);
  }

  onTaskSaved(savedTask: Task): void {
    if (this.isEditMode()) {
      this.tasks.set(
        this.tasks().map(existingTask =>
          existingTask.id === savedTask.id ? savedTask : existingTask
        )
      );
    } else {
      this.tasks.set([...this.tasks(), savedTask]);
    }

    this.closeDialog();
  }

  deleteTask(taskItem: Task): void {
    this.taskService.deleteTask(taskItem.id!).subscribe({
      next: () => {
        this.tasks.set(
          this.tasks().filter(existingTask =>
            existingTask.id !== taskItem.id
          )
        );
      },
      error: (error) => {
        console.error('Failed to delete task:', error);
        this.showErrorMessage('Could not delete the task. Please try again.');
        this.changeDetector.detectChanges();
      },
    });
  }

  changeStatus(taskItem: Task, newStatus: string): void {
    if (this.isInvalidStatusChange(taskItem, newStatus)) {
      this.showErrorMessage(
        '⚠️ Please assign this task to someone before moving it to In Progress'
      );
      return;
    }

    this.taskService.updateTaskStatus(taskItem.id!, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks.set(
          this.tasks().map(existingTask =>
            existingTask.id === updatedTask.id ? updatedTask : existingTask
          )
        );
      },
      error: (error) => {
        console.error('Failed to update task status:', error);
        this.showErrorMessage('Could not update task status. Please try again.');
        this.changeDetector.detectChanges();
      },
    });
  }

  onDragStart(taskItem: Task): void {
    this.draggedTask = taskItem;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(newStatus: string): void {
    if (!this.draggedTask) return;

    const draggedTaskItem = this.draggedTask;

    if (this.isInvalidStatusChange(draggedTaskItem, newStatus)) {
      this.showErrorMessage(
        '⚠️ Please assign this task before moving it to In Progress'
      );
      this.clearDraggedTask();
      return;
    }

    if (this.isSameStatus(draggedTaskItem, newStatus)) {
      this.clearDraggedTask();
      return;
    }

    this.updateTaskStatus(draggedTaskItem, newStatus);
  }

  private isInvalidStatusChange(taskItem: Task, newStatus: string): boolean {
    const isRestrictedStatus =
      newStatus === TASK_STATUSES.IN_PROGRESS ||
      newStatus === TASK_STATUSES.DONE;

    return isRestrictedStatus && !taskItem.assigneeEmail;
  }

  private isSameStatus(taskItem: Task, newStatus: string): boolean {
    return taskItem.status === newStatus;
  }

  private clearDraggedTask(): void {
    this.draggedTask = null;
  }

  private showErrorMessage(message: string): void {
    this.globalTaskError = message;

    setTimeout(() => {
      this.globalTaskError = '';
    }, GLOBAL_ERROR_DISMISS_MS);
  }

  private updateTaskStatus(taskItem: Task, newStatus: string): void {
    this.taskService.updateTaskStatus(taskItem.id!, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks.set(
          this.tasks().map(existingTask =>
            existingTask.id === updatedTask.id ? updatedTask : existingTask
          )
        );

        this.clearDraggedTask();
      },
      error: (error) => {
        console.error('Failed to update task status:', error);
        this.showErrorMessage('Could not update task status. Please try again.');
        this.clearDraggedTask();
        this.changeDetector.detectChanges();
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
