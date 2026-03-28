import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    ButtonsModule,
    RouterModule  
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent implements OnInit {

  user: any = { name: '', email: '' };

  items = [
    { text: 'Dashboard', route: '/dashboard' },
    { text: 'Projects', route: '/projects' },
    { text: 'Profile', route: '/profile' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }
}

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth']);
  }
}