import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const TENANT_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Pulpit', icon: 'grid' },
  { path: '/offers', label: 'Oferty', icon: 'file' },
  { path: '/events', label: 'Eventy', icon: 'calendar' },
  { path: '/employees', label: 'Pracownicy', icon: 'users' },
  { path: '/settings', label: 'Ustawienia', icon: 'settings' },
];

const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { path: '/tenants', label: 'Tenanci', icon: 'building' },
  { path: '/settings', label: 'Ustawienia', icon: 'settings' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected authService = inject(AuthService);
  private router = inject(Router);

  protected get navItems(): NavItem[] {
    return this.authService.isSuperAdmin() ? SUPER_ADMIN_NAV_ITEMS : TENANT_NAV_ITEMS;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
