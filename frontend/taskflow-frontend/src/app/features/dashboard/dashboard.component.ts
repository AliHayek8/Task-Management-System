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
    if (this.user?.id) this.loadProjects(this.user.id);
  }

  loadProjects(userId: number) {
    this.projectService.getProjectsByOwner(userId)
      .subscribe({
        next: (projects) => {
          if (projects.length === 0) {
            this.projects.set([]);
            this.updateStatsFromTasks([], []);
            return;
          }
          this.loadAllTasks(projects);
        },
        error: (err) => console.error(err)
      });
  }

  loadAllTasks(projects: any[]) {
    const requests = projects.map(p => this.taskService.getTasksByProject(p.id));

    forkJoin(requests).subscribe({
      next: (results) => {
        const allTasks: Task[] = results.flat();

        const myTasks = allTasks.filter(t => t.assigneeEmail === this.user.email);

        const updatedProjects = projects.map(project => {
          const projectTasks = allTasks.filter(t => t.projectId === project.id);
          return {
            ...project,
            tasks: projectTasks,
            totalTasks: projectTasks.length,
            tasksCompleted: projectTasks.filter(t => t.status === 'DONE').length
          };
        });

        this.projects.set(updatedProjects);
        this.updateStatsFromTasks(projects, myTasks);
      },
      error: (err) => console.error(err)
    });
  }

  updateStatsFromTasks(projects: any[], tasks: Task[]) {
    this.stats.set([
      { title: 'Done', value: tasks.filter(t => t.status==='DONE').length, icon: 'fa-circle-check', color: '#10b981' },
      { title: 'In Progress', value: tasks.filter(t => t.status==='IN_PROGRESS').length, icon: 'fa-spinner', color: '#f59e0b' },
      { title: 'To Do', value: tasks.filter(t => t.status==='TODO').length, icon: 'fa-list-check', color: '#ef4444' }
    ]);
  }

}
