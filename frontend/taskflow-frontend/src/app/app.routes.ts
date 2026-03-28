import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { ProjectsList } from './features/projects/projects-list/projects-list.component';

export const routes: Routes = [

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'projects', component: ProjectsList }
    ]
  }

];