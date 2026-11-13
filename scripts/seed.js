const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cradhlhcivrxiifnzvqb.supabase.co',
  'sb_publishable_IxmY69i3lZk1jlmzzKs2Gw_mDc6HGUn'
);

async function seed() {
  console.log('Seeding initial organizer and events...');

  // 1. Insert Organizer
  const { data: org, error: orgErr } = await supabase
    .from('organizers')
    .insert({
      name: 'SceneO Curated Hosts',
      phone: '+919988776655',
      email: 'sceneo.in@gmail.com',
      upi_id: 'sceneo@upi',
      staff_scanner_pin: '8421',
      is_verified: true
    })
    .select()
    .single();

  if (orgErr) {
    console.error('Error inserting organizer:', orgErr);
    return;
  }
  console.log('Created Organizer:', org.id);

  // 2. Insert Events
  const events = [
    {
      organizer_id: org.id,
      slug: 'indie-live-concert-04',
      title: 'Live Sessions // Contemporary Acoustic & Indie Concert',
      description: 'An intimate contemporary live music session featuring independent singer-songwriters in an acoustic auditorium hall.',
      category: 'music',
      venue_type: 'auditorium',
      venue_name: 'The Community Auditorium, Jubilee Hills',
      city: 'Hyderabad',
      address: 'Road No 36, Jubilee Hills, Hyderabad',
      event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      gates_open: '07:30 PM',
      poster_url: '/banners/acoustic-sunset.svg',
      age_restriction: 'All Ages',
      cover_charge_note: 'Entry pass only. No mandatory cover charge at door.',
      outside_food_allowed: false,
      seat_allocation_mode: 'general_admission',
      is_published: true
    },
    {
      organizer_id: org.id,
      slug: 'anime-night-prasad-audi-3',
      title: 'Anime Fan Screening: Studio Classics (Audi 3)',
      description: 'Exclusive fan club theater screening on the big screen with high-fidelity surround sound. Special popcorn combos included for Recliner seats.',
      category: 'screening',
      venue_type: 'theater',
      venue_name: "Prasad's Multiplex • Screen 3",
      audi_screen_number: 'Audi 3',
      city: 'Hyderabad',
      address: 'Necklace Road, NTR Gardens, Hyderabad',
      event_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      gates_open: '06:00 PM',
      poster_url: '/banners/theater-audi.svg',
      age_restriction: 'U/A (All Ages Welcome)',
      cover_charge_note: 'Outside food/beverages strictly prohibited by cinema management.',
      outside_food_allowed: false,
      seat_allocation_mode: 'general_admission',
      is_published: true
    },
    {
      organizer_id: org.id,
      slug: 'sunset-indie-acoustic-rooftop',
      title: 'Sunset Unplugged // Indie & Chai Session',
      description: 'Intimate acoustic music, golden hour coffee, and indie songwriting under the open evening sky.',
      category: 'acoustic',
      venue_type: 'rooftop',
      venue_name: 'Skyline Terrace Lounge',
      city: 'Hyderabad',
      address: 'Road No 36, Jubilee Hills, Hyderabad',
      event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      gates_open: '05:30 PM',
      poster_url: '/banners/acoustic-sunset.svg',
      age_restriction: '18+',
      cover_charge_note: 'Entry includes 1 complimentary artisanal hot beverage.',
      outside_food_allowed: false,
      seat_allocation_mode: 'general_admission',
      is_published: true
    }
  ];

  const { data: insertedEvents, error: evErr } = await supabase
    .from('events')
    .insert(events)
    .select();

  if (evErr) {
    console.error('Error inserting events:', evErr);
    return;
  }
  console.log('Inserted', insertedEvents.length, 'events');

  // 3. Insert Ticket Tiers for Each Event
  const tiers = [
    // Sub-zero
    { event_id: insertedEvents[0].id, tier_name: 'Phase 1 Pass', price: 499.00, total_capacity: 150, description: 'General standing entry before 11:00 PM' },
    { event_id: insertedEvents[0].id, tier_name: 'Phase 2 / Couple Pass', price: 899.00, total_capacity: 80, description: 'Entry for two attendees all night' },
    { event_id: insertedEvents[0].id, tier_name: 'VIP Deck Pass', price: 1499.00, total_capacity: 30, description: 'Elevated VIP viewing platform & private bar' },

    // Movie Theater
    { event_id: insertedEvents[1].id, tier_name: 'Balcony Pass', price: 299.00, total_capacity: 180, description: 'Balcony elevated seating' },
    { event_id: insertedEvents[1].id, tier_name: 'First Class / Stalls', price: 199.00, total_capacity: 220, description: 'Main theater hall center seating' },
    { event_id: insertedEvents[1].id, tier_name: 'VIP Recliner Row', price: 549.00, total_capacity: 24, description: 'Luxury leather recliner row + popcorn combo' },

    // Acoustic Rooftop
    { event_id: insertedEvents[2].id, tier_name: 'Solo Sunset Pass', price: 299.00, total_capacity: 60, description: 'Single entry + welcome hot beverage' },
    { event_id: insertedEvents[2].id, tier_name: 'Duo Pass', price: 499.00, total_capacity: 40, description: 'Couple or friends entry for two' }
  ];

  const { data: insertedTiers, error: tierErr } = await supabase
    .from('ticket_tiers')
    .insert(tiers)
    .select();

  if (tierErr) {
    console.error('Error inserting tiers:', tierErr);
  } else {
    console.log('Inserted', insertedTiers.length, 'ticket tiers successfully!');
  }
}

seed();
