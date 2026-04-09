import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';


export interface User {
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getProfile(token: string): Observable<User> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<User>(`${this.apiUrl}/me`, { headers });
  }

  updateName(token: string, name: string): Observable<User> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http.put<User>(`${this.apiUrl}/me`, { name }, { headers });
  }

  setCurrentUser(user: User) {
    this.currentUserSubject.next({ ...user });
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }

  loadFromSession() {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }
}
