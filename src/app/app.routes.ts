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
    loadComponent: () => import('./pages/admin/shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'foglalasok',
        pathMatch: 'full'
      },
      {
        path: 'foglalasok',
        loadComponent: () => import('./pages/admin/bookings/admin-bookings.component').then((m) => m.AdminBookingsComponent)
      },
      {
        path: 'arak',
        loadComponent: () => import('./pages/admin/prices/admin-prices.component').then((m) => m.AdminPricesComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
