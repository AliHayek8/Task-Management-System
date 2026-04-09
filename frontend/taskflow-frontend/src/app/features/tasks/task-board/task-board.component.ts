import {
  Component,
  OnInit,
  signal,
  PLATFORM_ID,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';

import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectService } from '../../../core/services/project/project.service';
import { TaskFormComponent } from '../task-form/task-form.component';
import {
  getPriorityColor,
  getSessionUser,
  GLOBAL_ERROR_DISMISS_MS,
  TASK_STATUSES,
} from './task-board.utils';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, ButtonsModule, TaskFormComponent],
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
  globalError  = '';


  readonly getPriorityColor = getPriorityColor;
  readonly TASK_STATUSES    = TASK_STATUSES;



  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId')) || 1;

    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
      this.loadProjectName();
    }
  }



  loadProjectName(): void {
    const user = getSessionUser();
    if (!user?.id) return;

    this.projectService.getProjectsByOwner(user.id).subscribe({
      next: (projects) => {
        const matchedProject = projects.find(project => project.id === this.projectId);
        if (matchedProject) {
          this.projectName = matchedProject.name;
        }
      },
      error: (err) => {
        console.error('Failed to load project name:', err);
      },
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
        this.isLoading.set(false);
      },
    });
  }


  goBackToProjects(): void {
    this.router.navigate(['/projects']);
  }


  getTasksByStatus(status: string): Task[] {
    return this.tasks().filter(task => task.status === status);
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
      this.tasks.set(
        this.tasks().map(task => task.id === savedTask.id ? savedTask : task)
      );
    } else {
      this.tasks.set([...this.tasks(), savedTask]);
    }
    this.closeDialog();
  }

  deleteTask(task: Task): void {
    this.taskService.deleteTask(task.id!).subscribe({
      next: () => {
        this.tasks.set(this.tasks().filter(existingTask => existingTask.id !== task.id));
      },
      error: (err) => {
        console.error('Failed to delete task:', err);
        this.globalError = 'Could not delete the task. Please try again.';
        setTimeout(() => (this.globalError = ''), GLOBAL_ERROR_DISMISS_MS);
        this.cdr.detectChanges();
      },
    });
  }

  changeStatus(task: Task, newStatus: string): void {
    if (
      task.status === TASK_STATUSES.TODO &&
      newStatus === TASK_STATUSES.IN_PROGRESS &&
      !task.assigneeEmail
    ) {
      this.globalError = '⚠️ Please assign this task to someone before moving it to In Progress';
      setTimeout(() => (this.globalError = ''), GLOBAL_ERROR_DISMISS_MS);
      return;
    }

    this.taskService.updateTaskStatus(task.id!, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks.set(
          this.tasks().map(existingTask =>
            existingTask.id === updatedTask.id ? updatedTask : existingTask
          )
        );
      },
      error: (err) => {
        console.error('Failed to update task status:', err);
        this.globalError = 'Could not update task status. Please try again.';
        setTimeout(() => (this.globalError = ''), GLOBAL_ERROR_DISMISS_MS);
        this.cdr.detectChanges();
      },
    });
  }


  // Private Helpers

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
