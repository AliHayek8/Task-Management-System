import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth',
    renderMode: RenderMode.Server
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects/:projectId/tasks',
    renderMode: RenderMode.Client
  },
  {
    path: 'profile',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
