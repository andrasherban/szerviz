export interface ServicePrice {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  price_suffix: string;
  display_order: number;
  duration_minutes: number;
  is_highlighted: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ServicePriceUpsert = Pick<
  ServicePrice,
  'name' | 'description' | 'price_amount' | 'price_suffix' | 'display_order' | 'duration_minutes' | 'is_highlighted' | 'is_active'
>;
