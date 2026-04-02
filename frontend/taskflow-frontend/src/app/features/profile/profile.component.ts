import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../core/services/user/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit {
  user: User = { name: '', email: '' };
  editedName: string = '';
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
      this.editedName = this.user.name;
    }

    this.fetchUser();
  }

  fetchUser() {
    if (!this.token) return;

    this.userService.getProfile(this.token).subscribe({
      next: (res) => {
        this.user = res;
        this.editedName = res.name;
        this.userService.setCurrentUser(res);
      },
      error: (err) => console.error(err),
    });
  }

  saveGeneral() {
    if (!this.editedName.trim()) {
      alert('Name cannot be empty!');
      return;
    }

    this.userService.updateName(this.token, this.editedName).subscribe({
      next: (res: User) => {
        this.user = res;
        this.editedName = res.name;
        this.userService.setCurrentUser(res);
        alert('Profile updated successfully!');
      },
      error: (err) => console.error(err),
    });
  }

  cancelEdit() {
    this.editedName = this.user.name;
  }
}
