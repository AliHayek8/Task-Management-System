import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonsModule
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent {

  constructor(private router: Router) {}

  items = [
    { text: 'Dashboard', route: '/dashboard' },
    { text: 'Projects', route: '/projects' },
    { text: 'Profile', route: '/profile' }
  ];

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.router.navigate(['/auth']);
  }
}