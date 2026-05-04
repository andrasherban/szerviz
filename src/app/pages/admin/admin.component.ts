import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Booking, BookingStatus } from '../../models/booking.model';
import { ServicePrice, ServicePriceUpsert } from '../../models/service-price.model';
import { GumiApiService } from '../../services/gumi-api.service';

interface LoginForm {
  email: string;
  password: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly api = inject(GumiApiService);

  readonly companyName = 'Duna Gumi Szerviz';
  readonly statuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

  login: LoginForm = { email: '', password: '' };
  loggedIn = false;
  adminAllowed = false;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  bookings: Booking[] = [];
  prices: ServicePrice[] = [];

  newPrice: ServicePriceUpsert = this.createEmptyPrice();

  async ngOnInit(): Promise<void> {
    await this.checkSession();
  }

  async checkSession(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.loggedIn = await this.api.isLoggedIn();
      this.adminAllowed = this.loggedIn ? await this.api.isAdmin() : false;

      if (this.adminAllowed) {
        await this.refreshAdminData();
      }
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async signIn(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.api.signIn(this.login.email, this.login.password);
      this.loggedIn = true;
      this.adminAllowed = await this.api.isAdmin();

      if (!this.adminAllowed) {
        this.errorMessage = 'Sikeres belépés, de ez a felhasználó nincs admin jogosultsággal felvéve az admin_users táblába.';
        return;
      }

      await this.refreshAdminData();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async signOut(): Promise<void> {
    await this.api.signOut();
    this.loggedIn = false;
    this.adminAllowed = false;
    this.bookings = [];
    this.prices = [];
  }

  async refreshAdminData(): Promise<void> {
    const [bookings, prices] = await Promise.all([
      this.api.getBookings(),
      this.api.getAllPricesForAdmin()
    ]);

    this.bookings = bookings;
    this.prices = prices;
  }

  async updateBookingStatus(booking: Booking, status: BookingStatus): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.api.updateBookingStatus(booking.id, status);
      booking.status = status;
      this.successMessage = 'Foglalás státusza frissítve.';
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.saving = false;
    }
  }

  async savePrice(price: ServicePrice): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.api.updatePrice(price.id, this.toPriceUpsert(price));
      this.successMessage = 'Ár frissítve.';
      await this.refreshAdminData();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.saving = false;
    }
  }

  async createPrice(): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.api.createPrice(this.newPrice);
      this.successMessage = 'Új árlista elem létrehozva.';
      this.newPrice = this.createEmptyPrice();
      await this.refreshAdminData();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.saving = false;
    }
  }

  formatPrice(price: ServicePrice): string {
    return `${Number(price.price_amount).toLocaleString('hu-HU')} ${price.price_suffix}`;
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case 'pending': return 'Függőben';
      case 'confirmed': return 'Visszaigazolt';
      case 'completed': return 'Elvégezve';
      case 'cancelled': return 'Lemondva';
    }
  }

  private toPriceUpsert(price: ServicePrice): ServicePriceUpsert {
    return {
      name: price.name,
      description: price.description,
      price_amount: Number(price.price_amount),
      price_suffix: price.price_suffix,
      display_order: Number(price.display_order),
      duration_minutes: Number(price.duration_minutes),
      is_highlighted: price.is_highlighted,
      is_active: price.is_active
    };
  }

  private createEmptyPrice(): ServicePriceUpsert {
    return {
      name: '',
      description: '',
      price_amount: 0,
      price_suffix: 'Ft-tól',
      display_order: 99,
      duration_minutes: 30,
      is_highlighted: false,
      is_active: true
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
  }
}
