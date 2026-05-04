export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  vehicle_type: string | null;
  license_plate: string | null;
  service_price_id: string | null;
  requested_date: string;
  requested_time: string;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  service_prices?: {
    name: string;
  } | null;
}

export interface CreateBookingRequest {
  customer_name: string;
  phone: string;
  email: string | null;
  vehicle_type: string | null;
  license_plate: string | null;
  service_price_id: string | null;
  requested_date: string;
  requested_time: string;
  note: string | null;
}
