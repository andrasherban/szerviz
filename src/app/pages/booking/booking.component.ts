import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CreateBookingRequest } from '../../models/booking.model';
import { ServicePrice } from '../../models/service-price.model';
import { GumiApiService } from '../../services/gumi-api.service';

interface BookingForm {
  customer_name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  license_plate: string;
  service_price_id: string;
  requested_date: string;
  requested_time: string;
  note: string;
}

interface OpeningWindow {
  start: string;
  end: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss'
})
export class BookingComponent implements OnInit {
  private readonly api = inject(GumiApiService);

  readonly companyName = 'Duna Gumi Szerviz';
  readonly phoneNumber = '+36 30 123 4567';
  readonly minDate = this.formatDate(new Date());

  prices: ServicePrice[] = [];
  availableSlots: string[] = [];
  bookedSlots: string[] = [];

  loadingPrices = true;
  loadingSlots = false;
  sending = false;
  successMessage = '';
  errorMessage = '';

  booking: BookingForm = this.createEmptyBooking();

  async ngOnInit(): Promise<void> {
    this.booking.requested_date = this.minDate;
    await this.loadPrices();
    await this.loadSlots();
  }

  async loadPrices(): Promise<void> {
    this.loadingPrices = true;
    this.errorMessage = '';

    try {
      this.prices = await this.api.getActivePrices();
      if (this.prices.length > 0) {
        this.booking.service_price_id = this.prices[0].id;
      }
    } catch (error) {
      this.errorMessage = `Nem sikerült betölteni az árlistát. Ellenőrizd a Supabase beállításokat. ${this.getErrorMessage(error)}`;
    } finally {
      this.loadingPrices = false;
    }
  }

  async loadSlots(clearMessages = true): Promise<void> {
    this.loadingSlots = true;
    if (clearMessages) {
      this.errorMessage = '';
      this.successMessage = '';
    }
    this.booking.requested_time = '';

    try {
      const generatedSlots = this.generateSlotsForDate(this.booking.requested_date);
      this.bookedSlots = await this.api.getBookedTimes(this.booking.requested_date);
      this.availableSlots = generatedSlots.filter((slot) => !this.bookedSlots.includes(slot));
    } catch (error) {
      this.availableSlots = [];
      this.errorMessage = `Nem sikerült betölteni a szabad időpontokat. ${this.getErrorMessage(error)}`;
    } finally {
      this.loadingSlots = false;
    }
  }

  selectSlot(slot: string): void {
    this.booking.requested_time = slot;
  }

  async submitBooking(): Promise<void> {
    this.sending = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: CreateBookingRequest = {
      customer_name: this.booking.customer_name.trim(),
      phone: this.booking.phone.trim(),
      email: this.toNullable(this.booking.email),
      vehicle_type: this.toNullable(this.booking.vehicle_type),
      license_plate: this.toNullable(this.booking.license_plate),
      service_price_id: this.booking.service_price_id || null,
      requested_date: this.booking.requested_date,
      requested_time: this.booking.requested_time,
      note: this.toNullable(this.booking.note)
    };

    try {
      await this.api.createBooking(request);
      this.successMessage = 'Köszönjük! A foglalási kérésed megérkezett. Hamarosan visszaigazoljuk telefonon vagy e-mailben.';
      const keptDate = this.booking.requested_date;
      this.booking = this.createEmptyBooking();
      this.booking.requested_date = keptDate;
      if (this.prices.length > 0) {
        this.booking.service_price_id = this.prices[0].id;
      }
      await this.loadSlots(false);
    } catch (error) {
      this.errorMessage = `Nem sikerült elküldeni a foglalást. Lehet, hogy ezt az időpontot közben lefoglalták. ${this.getErrorMessage(error)}`;
      await this.loadSlots(false);
    } finally {
      this.sending = false;
    }
  }

  formatPrice(price: ServicePrice): string {
    return `${price.price_amount.toLocaleString('hu-HU')} ${price.price_suffix}`;
  }

  getSelectedService(): ServicePrice | undefined {
    return this.prices.find((price) => price.id === this.booking.service_price_id);
  }

  private createEmptyBooking(): BookingForm {
    return {
      customer_name: '',
      phone: '',
      email: '',
      vehicle_type: '',
      license_plate: '',
      service_price_id: '',
      requested_date: '',
      requested_time: '',
      note: ''
    };
  }

  private generateSlotsForDate(dateValue: string): string[] {
    if (!dateValue) return [];

    const date = new Date(`${dateValue}T12:00:00`);
    const day = date.getDay();
    const openingWindow = this.getOpeningWindow(day);

    if (!openingWindow) return [];

    const slots: string[] = [];
    let current = this.toMinutes(openingWindow.start);
    const end = this.toMinutes(openingWindow.end);
    const today = this.formatDate(new Date());
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    while (current < end) {
      const slot = this.fromMinutes(current);
      const isPastToday = dateValue === today && current <= nowMinutes + 30;

      if (!isPastToday) {
        slots.push(slot);
      }

      current += 30;
    }

    return slots;
  }

  private getOpeningWindow(day: number): OpeningWindow | null {
    if (day >= 1 && day <= 4) return { start: '08:00', end: '17:00' };
    if (day === 5) return { start: '08:00', end: '16:00' };
    if (day === 6) return { start: '09:00', end: '13:00' };
    return null;
  }

  private toMinutes(time: string): number {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  }

  private fromMinutes(value: number): string {
    const hour = Math.floor(value / 60).toString().padStart(2, '0');
    const minute = (value % 60).toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toNullable(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '';
  }
}
