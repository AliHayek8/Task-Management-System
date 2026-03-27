import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { Dashboard } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: Dashboard },
];
