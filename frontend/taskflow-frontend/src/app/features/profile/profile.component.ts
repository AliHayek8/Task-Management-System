import { Component, signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../core/services/user/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit {
  user: User = { name: '', email: '' };
  editableUser: User = { name: '', email: '' };

  selectedTab = signal<'general'>('general');
  token: string = '';

  constructor(
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.token = sessionStorage.getItem('token') || '';

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.editableUser = { ...this.user };
    }

    this.fetchUser();
  }

  fetchUser() {
    if (!this.token) return;

    this.userService.getProfile(this.token).subscribe({
      next: (res) => {
        this.user = res;
        this.editableUser = { ...res };
        this.userService.setCurrentUser(res);
      },
      error: (err) => console.error(err),
    });
  }

  saveGeneral() {
    if (!this.editableUser.name.trim()) {
      alert('Name cannot be empty!');
      return;
    }

    this.userService.updateName(this.token, this.editableUser.name).subscribe({
      next: (res: User) => {
        console.log('SAVED USER:', res);
        this.user = res;
        this.editableUser = { ...res };
        this.userService.setCurrentUser(res);
        alert('Profile updated successfully!');
      },
      error: (err) => console.error(err),
    });
  }

  cancelEdit() {
    this.editableUser = { ...this.user };
  }

}
