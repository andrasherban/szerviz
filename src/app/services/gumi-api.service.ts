import { Injectable, inject } from '@angular/core';
import { Booking, BookingStatus, CreateBookingRequest } from '../models/booking.model';
import { ServicePrice, ServicePriceUpsert } from '../models/service-price.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class GumiApiService {
  private readonly supabase = inject(SupabaseService).client;

  async getActivePrices(): Promise<ServicePrice[]> {
    const { data, error } = await this.supabase
      .from('service_prices')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ServicePrice[];
  }

  async getAllPricesForAdmin(): Promise<ServicePrice[]> {
    const { data, error } = await this.supabase
      .from('service_prices')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ServicePrice[];
  }

  async createPrice(price: ServicePriceUpsert): Promise<void> {
    const { error } = await this.supabase.from('service_prices').insert(price);
    if (error) throw error;
  }

  async updatePrice(id: string, price: ServicePriceUpsert): Promise<void> {
    const { error } = await this.supabase
      .from('service_prices')
      .update(price)
      .eq('id', id);

    if (error) throw error;
  }

  async getBookedTimes(date: string): Promise<string[]> {
    const { data, error } = await this.supabase.rpc('get_booked_times', {
      target_date: date
    });

    if (error) throw error;
    return (data ?? []).map((row: { requested_time: string }) => row.requested_time.slice(0, 5));
  }

  async createBooking(request: CreateBookingRequest): Promise<void> {
    const { error } = await this.supabase.from('bookings').insert({
      ...request,
      status: 'pending'
    });

    if (error) throw error;
  }

  async getBookings(): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, service_prices(name)')
      .order('requested_date', { ascending: true })
      .order('requested_time', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Booking[];
  }

  async getBookingsBetween(startDate: string, endDate: string): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, service_prices(name)')
      .gte('requested_date', startDate)
      .lte('requested_date', endDate)
      .order('requested_date', { ascending: true })
      .order('requested_time', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Booking[];
  }

  async getLatestBookings(limit = 20): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, service_prices(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Booking[];
  }



  async searchBookingsByLicensePlate(query: string, limit = 50): Promise<Booking[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, service_prices(name)')
      .ilike('license_plate', `%${trimmed}%`)
      .order('requested_date', { ascending: false })
      .order('requested_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Booking[];
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
    const { error } = await this.supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return !!data.session;
  }

  async isAdmin(): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('admin_users')
      .select('user_id')
      .limit(1)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }
}
