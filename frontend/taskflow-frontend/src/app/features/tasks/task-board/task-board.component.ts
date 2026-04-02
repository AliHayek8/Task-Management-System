import { Component, OnInit, signal, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { TaskService, Task } from '../../../core/services/task/task.service';
import { ProjectService } from '../../../core/services/project/project.service';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [FormsModule, ButtonsModule,CommonModule],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss'
})
export class TaskBoard implements OnInit {

  projectId!: number;
  projectName = '';
  tasks = signal<Task[]>([]);
  showDialog = signal(false);
  isEditMode = signal(false);
  selectedTask = signal<Task | null>(null);
  taskForm: Task = this.getEmptyTask();
  errorMessage = '';
  globalError = '';
  isLoading = signal(false);

  fieldErrors = {
    title: '',
    description: '',
    assigneeEmail: '',
    deadline: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId')) || 1;
    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
      this.loadProjectName();
    }
  }

  loadProjectName() {
    if (isPlatformBrowser(this.platformId)) {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user?.id) {
        this.projectService.getProjectsByOwner(user.id).subscribe({
          next: (projects) => {
            const project = projects.find(p => p.id === this.projectId);
            if (project) {
              this.projectName = project.name;
            }
          },
          error: () => {}
        });
      }
    }
  }

  goBackToProjects() {
    this.router.navigate(['/projects']);
  }

  loadTasks() {
    this.isLoading.set(true);
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getEmptyTask(): Task {
    return {
      id: undefined,
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeEmail: '',
      deadline: '',
      projectId: this.projectId || 1
    };
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  openAddDialog(status: string = 'TODO') {
    this.taskForm = this.getEmptyTask();
    this.taskForm.status = status as any;
    this.isEditMode.set(false);
    this.selectedTask.set(null);
    this.showDialog.set(true);
    this.errorMessage = '';
    this.resetFieldErrors();
  }

  openEditDialog(task: Task) {
    this.taskForm = { ...task };
    this.isEditMode.set(true);
    this.selectedTask.set(task);
    this.showDialog.set(true);
    this.errorMessage = '';
    this.resetFieldErrors();
  }

  closeDialog() {
    this.showDialog.set(false);
    this.errorMessage = '';
    this.resetFieldErrors();
  }

  resetFieldErrors() {
    this.fieldErrors = {
      title: '',
      description: '',
      assigneeEmail: '',
      deadline: ''
    };
  }

  validateTitle() {
    if (!this.taskForm.title.trim()) {
      this.fieldErrors.title = 'Title is required';
    } else if (this.taskForm.title.trim().length < 3) {
      this.fieldErrors.title = 'Title must be at least 3 characters';
    } else {
      this.fieldErrors.title = '';
    }
  }

  validateDescription() {
    if (this.taskForm.description && this.taskForm.description.trim().length > 0) {
      if (this.taskForm.description.trim().length < 30) {
        this.fieldErrors.description = 'Description must be at least 30 characters';
      } else {
        this.fieldErrors.description = '';
      }
    } else {
      this.fieldErrors.description = '';
    }
  }

  validateAssigneeEmail() {
    if (this.taskForm.assigneeEmail && this.taskForm.assigneeEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.taskForm.assigneeEmail)) {
        this.fieldErrors.assigneeEmail = 'Please enter a valid email';
      } else {
        this.fieldErrors.assigneeEmail = '';
      }
    } else {
      this.fieldErrors.assigneeEmail = '';
    }
  }

  validateDeadline() {
    if (this.taskForm.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(this.taskForm.deadline);
      if (deadline < today) {
        this.fieldErrors.deadline = 'Deadline cannot be in the past';
      } else {
        this.fieldErrors.deadline = '';
      }
    } else {
      this.fieldErrors.deadline = '';
    }
  }

  isFormValid(): boolean {
    this.validateTitle();
    this.validateDescription();
    this.validateAssigneeEmail();
    this.validateDeadline();

    if (this.taskForm.status !== 'TODO' && !this.taskForm.assigneeEmail) {
      this.errorMessage = 'Assignee email is required for In Progress and Done tasks';
      return false;
    }

    return !this.fieldErrors.title &&
           !this.fieldErrors.description &&
           !this.fieldErrors.assigneeEmail &&
           !this.fieldErrors.deadline;
  }

  saveTask() {
    if (!this.isFormValid()) {
      return;
    }

    if (this.isEditMode()) {
      this.taskService.updateTask(this.taskForm.id!, this.taskForm).subscribe({
        next: (updatedTask) => {
          this.tasks.set(
            this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t)
          );
          this.closeDialog();
        },
        error: (err) => {
          this.handleTaskError(err);
        }
      });
    } else {
      this.taskForm.projectId = this.projectId;
      this.taskService.createTask(this.taskForm).subscribe({
        next: (newTask) => {
          this.tasks.set([...this.tasks(), newTask]);
          this.closeDialog();
        },
        error: (err) => {
          this.handleTaskError(err);
        }
      });
    }
  }

  handleTaskError(err: any) {
    if (err.status === 400) {
      const errorObj = err.error || {};
      const message = errorObj.message || '';

      if (message.includes('Assignee not found')) {
        this.fieldErrors.assigneeEmail = 'This email is not registered in the system';
        this.cdr.detectChanges();
      } else if (errorObj.description) {
        this.fieldErrors.description = errorObj.description;
        this.cdr.detectChanges();
      } else if (errorObj.title) {
        this.fieldErrors.title = errorObj.title;
        this.cdr.detectChanges();
      } else if (message) {
        this.errorMessage = message;
        this.cdr.detectChanges();
      } else {
        this.errorMessage = 'Invalid data. Please check your inputs.';
        this.cdr.detectChanges();
      }
    } else {
      this.errorMessage = 'Something went wrong. Please try again.';
      this.cdr.detectChanges();
    }
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id!).subscribe({
      next: () => {
        this.tasks.set(this.tasks().filter(t => t.id !== task.id));
      },
      error: () => {}
    });
  }

  changeStatus(task: Task, newStatus: string) {
    if (task.status === 'TODO' && newStatus === 'IN_PROGRESS' && !task.assigneeEmail) {
      this.globalError = '⚠️ Please assign this task to someone before moving it to In Progress';
      setTimeout(() => this.globalError = '', 4000);
      return;
    }

    this.taskService.updateTaskStatus(task.id!, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks.set(
          this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t)
        );
      },
      error: () => {}
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f97316';
      case 'LOW': return '#22c55e';
      default: return '#6b7280';
    }
  }
}
