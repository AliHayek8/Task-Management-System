import { Component, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { TaskService, Task } from '../../../core/services/task/task.service';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonsModule],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss'
})
export class TaskBoard implements OnInit {

  projectId!: number;
  tasks = signal<Task[]>([]);
  showDialog = signal(false);
  isEditMode = signal(false);
  selectedTask = signal<Task | null>(null);
  taskForm: Task = this.getEmptyTask();
  errorMessage = '';
  isLoading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId')) || 1;
    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
    }
  }

  loadTasks() {
    this.isLoading.set(true);
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.isLoading.set(false);
      }
    });
  }

  getEmptyTask(): Task {
    return {
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
    this.showDialog.set(true);
    this.errorMessage = '';
  }

  openEditDialog(task: Task) {
    this.taskForm = { ...task };
    this.isEditMode.set(true);
    this.selectedTask.set(task);
    this.showDialog.set(true);
    this.errorMessage = '';
  }

  closeDialog() {
    this.showDialog.set(false);
    this.errorMessage = '';
  }

  saveTask() {
    if (!this.taskForm.title.trim()) {
      this.errorMessage = 'Title is required';
      return;
    }

    if (this.taskForm.assigneeEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.taskForm.assigneeEmail)) {
        this.errorMessage = 'Please enter a valid email for assignee';
        return;
      }
    }

    if (this.isEditMode()) {
      this.taskService.updateTask(this.taskForm.id!, this.taskForm).subscribe({
        next: (updatedTask) => {
          this.tasks.set(this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t));
          this.closeDialog();
        },
        error: (err) => {
          if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'Failed to update task. Please try again.';
          }
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
          if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'Failed to create task. Please try again.';
          }
        }
      });
    }
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id!).subscribe({
      next: () => {
        this.tasks.set(this.tasks().filter(t => t.id !== task.id));
      },
      error: (err) => {
        console.error('Error deleting task:', err);
      }
    });
  }

  changeStatus(task: Task, newStatus: string) {
    this.taskService.updateTaskStatus(task.id!, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks.set(this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t));
      },
      error: (err) => {
        console.error('Error updating status:', err);
      }
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
