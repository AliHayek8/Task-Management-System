import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../core/services/user/user.service';
import { Observable } from 'rxjs';

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
    private userService: UserService
  ) {
    this.userService.loadFromSession();

    this.user$ = this.userService.currentUser$;
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/auth']);
  }
}
