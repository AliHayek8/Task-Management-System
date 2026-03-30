import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
 selector: 'app-dashboard',
 standalone: true,
 imports: [CommonModule],
 templateUrl: './dashboard.html',
 styleUrl: './dashboard.scss',
})
export class Dashboard {


stats = [
  { title: 'Projects', value: 12, icon: 'fa-folder-open', color: '#4f46e5' },
  { title: 'Done', value: 45, icon: 'fa-circle-check', color: '#10b981' },
  { title: 'In Progress', value: 8, icon: 'fa-spinner', color: '#f59e0b' },
  { title: 'To Do', value: 3, icon: 'fa-list-check', color: '#ef4444' }
];


 projects = [
   {
     name: 'Mobile App MVP',
     description: 'Build first version of the mobile...',
     progress: 0,
     tasks: 2,
     color: '#22c55e'
   },
   {
     name: 'API Integration',
     description: 'Connect third-party services and...',
     progress: 67,
     tasks: 3,
     color: '#8b5cf6'
   }
 ];


}
