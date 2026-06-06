// Shared TypeScript types that mirror what the API returns.

export type DealStatus = 'available' | 'negotiation' | 'hold' | 'sold';

export interface City {
  id: number;
  name: string;
  created_at: string;
  area_count?: number;
}

export interface AreaStats {
  total: number;
  available: number | null;
  negotiating: number | null;
  hold: number | null;
  closed: number | null;
  active_value: number | null;
}

export interface Area {
  id: number;
  city_id: number;
  name: string;
  created_at: string;
  stats?: AreaStats;
  city?: City;
}

export interface Buyer {
  id?: number;
  deal_id?: number;
  name: string;
  phone: string | null;
  offer_amount: number | null;
  note: string | null;
}

export interface Deal {
  id: number;
  area_id: number;
  plot_no: string;
  width_ft: number | null;
  length_ft: number | null;
  gaj: number | null;
  status: DealStatus;
  asking_price: number | null;
  expected_price: number | null;
  seller_name: string | null;
  seller_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buyers: Buyer[];
  // Present only on search results:
  area_name?: string;
  city_name?: string;
  city_id?: number;
}

// What the deal form sends to the API (no server-generated fields).
export interface DealInput {
  plot_no: string;
  width_ft: number | null;
  length_ft: number | null;
  gaj: number | null;
  status: DealStatus;
  asking_price: number | null;
  expected_price: number | null;
  seller_name: string | null;
  seller_phone: string | null;
  notes: string | null;
  buyers: Buyer[];
}
