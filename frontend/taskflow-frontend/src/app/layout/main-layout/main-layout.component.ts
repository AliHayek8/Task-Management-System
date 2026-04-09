import { Component, Inject, PLATFORM_ID } from '@angular/core';
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
export class MainLayoutComponent {

  user$: Observable<User | null>;

  items = [
    { text: 'Dashboard', route: '/dashboard' },
    { text: 'Projects', route: '/projects' },
    { text: 'Profile', route: '/profile' },
  ];

  constructor(
    private router: Router,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.userService.loadFromSession();
    }
    this.user$ = this.userService.currentUser$;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    this.router.navigate(['/auth']);
  }
}
