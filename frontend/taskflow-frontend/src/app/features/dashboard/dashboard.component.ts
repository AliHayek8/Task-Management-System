import { Component, OnInit, Inject, PLATFORM_ID, signal } from '@angular/core';
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

  projects = signal<any[]>([]);

  stats = signal([
    { title: 'Done', value: 0, icon: 'fa-circle-check', color: '#10b981' },
    { title: 'In Progress', value: 0, icon: 'fa-spinner', color: '#f59e0b' },
    { title: 'To Do', value: 0, icon: 'fa-list-check', color: '#ef4444' }
  ]);

  private currentUser: any = null;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

    if (this.currentUser?.id) {
      this.loadProjects(this.currentUser.id);
    }
  }

  loadProjects(userId: number) {
    this.projectService.getProjectsByOwner(userId)
      .subscribe({
        next: (projectsList) => {
          if (!projectsList.length) {
            this.projects.set([]);
            this.updateStatsFromTasks([]);
            return;
          }

          this.loadAllTasks(projectsList);
        },
      });
  }

  loadAllTasks(projectsList: any[]) {
    this.getTasksRequests(projectsList)
      .subscribe(taskResults => {

        const allTasks = this.flattenTasks(taskResults);
        const assignedTasks = this.getTasksAssignedToCurrentUser(allTasks);
        const projectsWithTasks = this.attachTasksToProjects(projectsList, allTasks);

        this.projects.set(projectsWithTasks);
        this.updateStatsFromTasks(assignedTasks);
      });
  }

  private getTasksRequests(projectsList: any[]) {
    const taskRequests = projectsList.map(project =>
      this.taskService.getTasksByProject(project.id)
    );

    return forkJoin(taskRequests);
  }

  private attachTasksToProjects(projectsList: any[], allTasks: Task[]) {
    return projectsList.map(project => {

      const tasksForProject = this.getTasksByProjectId(allTasks, project.id);

      return {
        ...project,
        tasks: tasksForProject,
        totalTasks: tasksForProject.length,
        tasksCompleted: this.countCompletedTasks(tasksForProject)
      };
    });
  }

  private flattenTasks(taskResults: Task[][]): Task[] {
    return taskResults.flat();
  }

  private getTasksAssignedToCurrentUser(allTasks: Task[]): Task[] {
    return allTasks.filter(task =>
      task.assigneeEmail === this.currentUser.email
    );
  }

  private getTasksByProjectId(allTasks: Task[], projectId: number): Task[] {
    return allTasks.filter(task =>
      task.projectId === projectId
    );
  }

  private countCompletedTasks(tasksList: Task[]): number {
    return tasksList.filter(task =>
      task.status === 'DONE'
    ).length;
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
