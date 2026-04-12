import { Component, PLATFORM_ID, inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { Observable } from 'rxjs';
import { UserService, User } from '../../core/services/user/user.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, ButtonsModule, RouterModule],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss'],
})
export class MainLayoutComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly platformId = inject(PLATFORM_ID);

  user$: Observable<User | null> = this.userService.currentUser$;

  items = [
    { text: 'Dashboard', route: '/dashboard' },
    { text: 'Projects', route: '/projects' },
    { text: 'Profile', route: '/profile' },
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.userService.loadFromSession();
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    this.router.navigate(['/auth']);
  }
}
