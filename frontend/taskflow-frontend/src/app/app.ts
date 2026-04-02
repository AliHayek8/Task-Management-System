import { Component, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('taskflow-frontend');

  isBooting = signal(true);

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      this.isBooting.set(false);
      return;
    }

    const sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError) {
        this.isBooting.set(false);
        sub.unsubscribe();
      }
    });

    setTimeout(() => {
      if (this.isBooting()) {
        this.isBooting.set(false);
      }
    }, 500);
  }
}
