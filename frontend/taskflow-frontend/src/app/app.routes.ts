import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { Dashboard } from './features/dashboard/dashboard.component';
import { ProjectsListComponent } from './features/projects/projects-list/projects-list.component';
import { Profile } from './features/profile/profile.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  {
    path: 'auth',
    component: AuthComponent,
    // يمنع المستخدم المسجل دخوله من الوصول لصفحة الـ Auth
    canActivate: [guestGuard]
  },

  {
    path: '',
    component: MainLayoutComponent,
    // يمنع المستخدم غير المسجل من الوصول للصفحات المحمية
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'projects', component: ProjectsListComponent },
      { path: 'profile', component: Profile },
    ]
  },

  { path: '**', redirectTo: 'auth' }
];
