import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { Dashboard } from './features/dashboard/dashboard.component';
import { ProjectsListComponent } from './features/projects/projects-list/projects-list.component';

import { TaskBoard } from './features/tasks/task-board/task-board.component';

import { ProfileComponent } from './features/profile/profile.component';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [guestGuard]
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'projects', component: ProjectsListComponent },

      { path: 'projects/:projectId/tasks', component: TaskBoard },
   

      { path: 'profile', component: ProfileComponent },

    ]
  },

  { path: '**', redirectTo: 'auth' }
];
