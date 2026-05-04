import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Booking, BookingStatus } from '../../../models/booking.model';
import { GumiApiService } from '../../../services/gumi-api.service';

interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  bookings: Booking[];
}

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.scss'
})
export class AdminBookingsComponent implements OnInit {
  private readonly api = inject(GumiApiService);
  private licensePlateSearchTimeout?: ReturnType<typeof setTimeout>;

  readonly statuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
  readonly weekDays = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

  loading = true;
  saving = false;
  searching = false;
  errorMessage = '';
  successMessage = '';

  currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  monthBookings: Booking[] = [];
  latestBookings: Booking[] = [];
  licensePlateSearchResults: Booking[] = [];
  licensePlateSearch = '';
  calendarDays: CalendarDay[] = [];
  selectedBooking: Booking | null = null;

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const start = this.toDateKey(new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1));
      const end = this.toDateKey(new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0));

      const [monthBookings, latestBookings] = await Promise.all([
        this.api.getBookingsBetween(start, end),
        this.api.getLatestBookings(20)
      ]);

      this.monthBookings = monthBookings;
      this.latestBookings = latestBookings;
      this.buildCalendar();

      if (this.hasLicensePlateSearch) {
        await this.searchByLicensePlate();
      }
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async previousMonth(): Promise<void> {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    await this.refresh();
  }

  async nextMonth(): Promise<void> {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    await this.refresh();
  }

  async goToToday(): Promise<void> {
    const today = new Date();
    this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    await this.refresh();
  }

  openBooking(booking: Booking): void {
    this.selectedBooking = booking;
  }

  closeBookingModal(): void {
    this.selectedBooking = null;
  }

  onLicensePlateSearchChange(): void {
    if (this.licensePlateSearchTimeout) {
      clearTimeout(this.licensePlateSearchTimeout);
    }

    this.licensePlateSearchTimeout = setTimeout(() => {
      void this.searchByLicensePlate();
    }, 250);
  }

  async searchByLicensePlate(): Promise<void> {
    this.errorMessage = '';

    if (!this.hasLicensePlateSearch) {
      this.licensePlateSearchResults = [];
      this.searching = false;
      return;
    }

    this.searching = true;

    try {
      this.licensePlateSearchResults = await this.api.searchBookingsByLicensePlate(this.licensePlateSearch, 50);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.searching = false;
    }
  }

  clearLicensePlateSearch(): void {
    this.licensePlateSearch = '';
    this.licensePlateSearchResults = [];
    this.searching = false;

    if (this.licensePlateSearchTimeout) {
      clearTimeout(this.licensePlateSearchTimeout);
    }
  }

  async updateBookingStatus(booking: Booking, status: BookingStatus): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.api.updateBookingStatus(booking.id, status);
      booking.status = status;

      if (this.selectedBooking?.id === booking.id) {
        this.selectedBooking = { ...this.selectedBooking, status };
      }

      this.successMessage = 'Foglalás státusza frissítve.';
      await this.refresh();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.saving = false;
    }
  }

  get monthLabel(): string {
    return new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long' }).format(this.currentMonth);
  }

  get displayedLatestBookings(): Booking[] {
    return this.hasLicensePlateSearch ? this.licensePlateSearchResults : this.latestBookings;
  }

  get hasLicensePlateSearch(): boolean {
    return this.licensePlateSearch.trim().length > 0;
  }

  get latestListTitle(): string {
    return this.hasLicensePlateSearch ? 'Rendszám keresési találatok' : 'Legfrissebb foglalások';
  }

  get latestListDescription(): string {
    return this.hasLicensePlateSearch
      ? 'A rendszám alapján talált foglalások vannak legfelül.'
      : 'A legutóbb beküldött foglalások vannak legfelül.';
  }

  get emptyListMessage(): string {
    return this.hasLicensePlateSearch
      ? 'Nincs találat erre a rendszámra.'
      : 'Még nincs foglalás.';
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case 'pending': return 'Függőben';
      case 'confirmed': return 'Visszaigazolt';
      case 'completed': return 'Elvégezve';
      case 'cancelled': return 'Lemondva';
    }
  }

  getCalendarBookingClass(booking: Booking): string {
    if (booking.status === 'pending') return 'pending';
    if (booking.status === 'confirmed' || booking.status === 'completed') return 'ok';
    return 'cancelled';
  }

  formatDateTime(booking: Booking): string {
    return `${booking.requested_date} · ${this.formatTime(booking.requested_time)}`;
  }

  formatTime(time: string): string {
    return time.slice(0, 5);
  }

  private buildCalendar(): void {
    const firstOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    const mondayBasedStartOffset = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(firstOfMonth);
    startDate.setDate(firstOfMonth.getDate() - mondayBasedStartOffset);

    const totalDays = Math.ceil((mondayBasedStartOffset + lastOfMonth.getDate()) / 7) * 7;
    const todayKey = this.toDateKey(new Date());

    this.calendarDays = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const dateKey = this.toDateKey(date);

      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === this.currentMonth.getMonth(),
        isToday: dateKey === todayKey,
        bookings: this.monthBookings
          .filter((booking) => booking.requested_date === dateKey)
          .sort((a, b) => a.requested_time.localeCompare(b.requested_time))
      };
    });
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
  }
}
