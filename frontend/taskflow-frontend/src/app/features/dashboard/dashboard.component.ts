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

  private user: any = null;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (this.user?.id) {
      this.loadProjects(this.user.id);
    }
  }


  loadProjects(userId: number) {
    this.projectService.getProjectsByOwner(userId)
      .subscribe({
        next: (projects) => {
          if (!projects.length) {
            this.projects.set([]);
            this.updateStatsFromTasks([]);
            return;
          }

          this.loadAllTasks(projects);
        },
      });
  }


  loadAllTasks(projects: any[]) {
    this.getTasksRequests(projects)
      .subscribe(results => {
        const allTasks = this.flattenTasks(results);
        const myTasks = this.getMyTasks(allTasks);
        const updatedProjects = this.attachTasksToProjects(projects, allTasks);

        this.projects.set(updatedProjects);
        this.updateStatsFromTasks(myTasks);
      });
  }


  private getTasksRequests(projects: any[]) {
    const requests = projects.map(p =>
      this.taskService.getTasksByProject(p.id)
    );

    return forkJoin(requests);
  }


  private flattenTasks(results: Task[][]): Task[] {
    return results.flat();
  }


  private getMyTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => t.assigneeEmail === this.user.email);
  }


  private attachTasksToProjects(projects: any[], allTasks: Task[]) {
    return projects.map(project => {
      const projectTasks = this.getTasksByProject(allTasks, project.id);

      return {
        ...project,
        tasks: projectTasks,
        totalTasks: projectTasks.length,
        tasksCompleted: this.countCompletedTasks(projectTasks)
      };
    });
  }


  private getTasksByProject(tasks: Task[], projectId: number): Task[] {
    return tasks.filter(t => t.projectId === projectId);
  }


  private countCompletedTasks(tasks: Task[]): number {
    return tasks.filter(t => t.status === 'DONE').length;
  }


  private calculateStats(tasks: Task[]) {
    let done = 0, inProgress = 0, todo = 0;

    tasks.forEach(t => {
      if (t.status === 'DONE') done++;
      else if (t.status === 'IN_PROGRESS') inProgress++;
      else if (t.status === 'TODO') todo++;
    });

    return { done, inProgress, todo };
  }

  updateStatsFromTasks(tasks: Task[]) {
    const stats = this.calculateStats(tasks);

    this.stats.set([
      { title: 'Done', value: stats.done, icon: 'fa-circle-check', color: '#10b981' },
      { title: 'In Progress', value: stats.inProgress, icon: 'fa-spinner', color: '#f59e0b' },
      { title: 'To Do', value: stats.todo, icon: 'fa-list-check', color: '#ef4444' }
    ]);
  }
}
