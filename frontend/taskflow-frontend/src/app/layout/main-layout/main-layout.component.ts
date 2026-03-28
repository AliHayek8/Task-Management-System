import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
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
  items = [
    { text: 'Dashboard', route: '/dashboard' },
    { text: 'Projects', route: '/projects' },
    { text: 'Profile', route: '/profile' }
  ];
}