import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface Task {
  id?: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeEmail?: string;
  assigneeName?: string;
  deadline?: string;
  projectId: number;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {

  private baseUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getHeaders(): HttpHeaders {
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getTasksByProject(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/projects/${projectId}/tasks`,
      { headers: this.getHeaders() }
    );
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(
      `${this.baseUrl}/tasks`,
      task,
      { headers: this.getHeaders() }
    );
  }

  updateTask(id: number, task: Task): Observable<Task> {
    return this.http.put<Task>(
      `${this.baseUrl}/tasks/${id}`,
      task,
      { headers: this.getHeaders() }
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/tasks/${id}`,
      { headers: this.getHeaders() }
    );
  }

  updateTaskStatus(id: number, status: string): Observable<Task> {
    return this.http.patch<Task>(
      `${this.baseUrl}/tasks/${id}/status?status=${status}`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
