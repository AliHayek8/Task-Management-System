import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { Dashboard } from './features/dashboard/dashboard.component';
import { ProjectsList } from './features/projects/projects-list/projects-list.component';
import { Profile } from './features/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  { path: 'auth', component: AuthComponent },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'projects', component: ProjectsList },
      { path: 'profile', component: Profile },
    ]
  },

  { path: '**', redirectTo: 'auth' }
];