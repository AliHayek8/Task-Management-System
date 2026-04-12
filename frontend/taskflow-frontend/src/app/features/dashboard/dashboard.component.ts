import {Component, OnInit, PLATFORM_ID, signal, inject} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProjectService } from '../../core/services/project/project.service';
import { TaskService, Task } from '../../core/services/task/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {

  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly platformId = inject(PLATFORM_ID);

  projects = signal<any[]>([]);
  loading = signal(false);

  stats = signal([
    { title: 'Done', value: 0, icon: 'fa-circle-check', color: '#10b981' },
    { title: 'In Progress', value: 0, icon: 'fa-spinner', color: '#f59e0b' },
    { title: 'To Do', value: 0, icon: 'fa-list-check', color: '#ef4444' }
  ]);

  private currentUser: any = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

    const userId = this.currentUser?.id;
    if (userId) {
      this.loadProjects(userId);
    }
  }


  loadProjects(userId: number) {
    this.loading.set(true);

    this.projectService.getProjectsByOwner(userId).subscribe({
      next: (projectsList) => {

        if (!projectsList.length) {
          this.projects.set([]);
          this.updateStatsFromTasks([]);
          this.loading.set(false);
          return;
        }

        this.loadAllTasks(projectsList);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadAllTasks(projectsList: any[]) {

    const requests = projectsList.map(project =>
      this.taskService.getTasksByProject(project.id)
    );

    forkJoin(requests).subscribe({
      next: (taskResults) => {

        const allTasks = taskResults.flat();

        const assignedTasks = this.getTasksAssignedToCurrentUser(allTasks);

        const projectsWithTasks = this.attachTasksToProjects(
          projectsList,
          allTasks
        );

        this.projects.set(projectsWithTasks);
        this.updateStatsFromTasks(assignedTasks);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private attachTasksToProjects(projectsList: any[], allTasks: Task[]) {
    return projectsList.map(project => {

      const tasksForProject = allTasks.filter(
        task => task.projectId === project.id
      );

      return {
        ...project,
        tasks: tasksForProject,
        totalTasks: tasksForProject.length,
        tasksCompleted: tasksForProject.filter(task => task.status === 'DONE').length
      };
    });
  }

  private getTasksAssignedToCurrentUser(allTasks: Task[]): Task[] {
    return allTasks.filter(task =>
      task.assigneeEmail === this.currentUser.email
    );
  }

  private calculateStats(tasksList: Task[]) {

    let doneCount = 0;
    let inProgressCount = 0;
    let todoCount = 0;

    tasksList.forEach(task => {
      if (task.status === 'DONE') doneCount++;
      else if (task.status === 'IN_PROGRESS') inProgressCount++;
      else if (task.status === 'TODO') todoCount++;
    });

    return { doneCount, inProgressCount, todoCount };
  }

  updateStatsFromTasks(tasksList: Task[]) {

    const stats = this.calculateStats(tasksList);

    this.stats.set([
      { title: 'Done', value: stats.doneCount, icon: 'fa-circle-check', color: '#10b981' },
      { title: 'In Progress', value: stats.inProgressCount, icon: 'fa-spinner', color: '#f59e0b' },
      { title: 'To Do', value: stats.todoCount, icon: 'fa-list-check', color: '#ef4444' }
    ]);
  }
}
