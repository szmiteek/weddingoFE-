import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { tenantGuard } from './core/guards/tenant.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'formularz/:token',
    loadComponent: () => import('./features/public-offer-form/public-offer-form').then((m) => m.PublicOfferForm),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [tenantGuard],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'employees',
        canActivate: [tenantGuard],
        loadComponent: () => import('./features/employees/employees').then((m) => m.Employees),
      },
      {
        path: 'offers',
        canActivate: [tenantGuard],
        loadComponent: () => import('./features/offers/offers-list/offers-list').then((m) => m.OffersList),
      },
      {
        path: 'offers/:id',
        canActivate: [tenantGuard],
        loadComponent: () => import('./features/offers/offer-detail/offer-detail').then((m) => m.OfferDetail),
      },
      {
        path: 'events',
        canActivate: [tenantGuard],
        loadComponent: () => import('./features/events/events-list/events-list').then((m) => m.EventsList),
      },
      {
        path: 'events/:id',
        canActivate: [tenantGuard],
        loadComponent: () => import('./features/events/event-detail/event-detail').then((m) => m.EventDetail),
      },
      {
        path: 'tenants',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./features/tenants/tenants').then((m) => m.Tenants),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
