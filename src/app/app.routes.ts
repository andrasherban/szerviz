import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'foglalas',
    loadComponent: () => import('./pages/booking/booking.component').then((m) => m.BookingComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
