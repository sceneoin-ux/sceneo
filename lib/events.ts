import { supabase } from './supabase';

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  venue_type: string;
  venue_name: string;
  audi_screen_number?: string;
  city: string;
  event_date: string;
  gates_open: string;
  poster_url: string;
  age_restriction: string;
  cover_charge_note?: string;
  ticket_tiers?: {
    id: string;
    tier_name: string;
    price: number;
    total_capacity: number;
    sold_count: number;
    description?: string;
  }[];
}

export async function getLiveEvents(): Promise<EventItem[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, ticket_tiers(*)')
      .eq('is_published', true)
      .order('event_date', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data as EventItem[];
  } catch (err) {
    console.error('Failed to fetch events from Supabase:', err);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, ticket_tiers(*)')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return data as EventItem;
  } catch (err) {
    console.error('Failed to fetch event by slug:', err);
    return null;
  }
}
