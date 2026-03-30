import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
  }
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    // استخدام sessionStorage بدل localStorage
    const token = sessionStorage.getItem('token');

    if (token && isTokenValid(token)) {
      return true;
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      router.navigate(['/auth']);
      return false;
    }
  }

  return true;
};
