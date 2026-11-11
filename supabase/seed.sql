-- ====================================================================
-- SCENEO SEED DATA: INITIAL LIVE EVENTS & ORGANIZER
-- Run this in Supabase SQL Editor to populate live test data
-- ====================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_event1_id UUID;
    v_event2_id UUID;
    v_event3_id UUID;
BEGIN
    -- 1. Create Default Verified Organizer
    INSERT INTO public.organizers (name, phone, email, upi_id, staff_scanner_pin, is_verified)
    VALUES ('SceneO Curated Hosts', '+918143749379', 'sceneo.in@gmail.com', 'sceneo@upi', '8421', TRUE)
    RETURNING id INTO v_org_id;

    -- 2. Insert Event 1: Contemporary Live Music Concert
    INSERT INTO public.events (
        organizer_id, slug, title, description, category, venue_type,
        venue_name, city, address, event_date, gates_open,
        poster_url, age_restriction, cover_charge_note, is_published
    ) VALUES (
        v_org_id,
        'indie-live-concert-04',
        'Live Sessions // Contemporary Acoustic & Indie Concert',
        'An intimate contemporary live music session featuring independent singer-songwriters in an acoustic auditorium hall.',
        'music',
        'auditorium',
        'The Community Auditorium, Jubilee Hills',
        'Hyderabad',
        'Road No 36, Jubilee Hills, Hyderabad',
        NOW() + INTERVAL '5 days',
        '07:30 PM',
        '/banners/acoustic-sunset.svg',
        'All Ages',
        'Entry pass only. No mandatory cover charge at door.',
        TRUE
    ) RETURNING id INTO v_event1_id;

    -- Tiers for Event 1
    INSERT INTO public.ticket_tiers (event_id, tier_name, price, total_capacity, description) VALUES
    (v_event1_id, 'General Entry Pass', 499.00, 150, 'Standard hall entry seating'),
    (v_event1_id, 'Couple Pass', 899.00, 80, 'Entry for two attendees'),
    (v_event1_id, 'Front Row Pass', 1499.00, 30, 'Front row seating & artist Q&A session');

    -- 3. Insert Event 2: Movie Theater Fan Screening (Audi 3)
    INSERT INTO public.events (
        organizer_id, slug, title, description, category, venue_type,
        venue_name, audi_screen_number, city, address, event_date, gates_open,
        poster_url, age_restriction, cover_charge_note, seat_allocation_mode, is_published
    ) VALUES (
        v_org_id,
        'anime-night-prasad-audi-3',
        'Anime Fan Screening: Studio Classics (Audi 3)',
        'Exclusive fan club theater screening on the big screen with high-fidelity surround sound. Special popcorn combos included for Recliner seats.',
        'theater_screening',
        'theater',
        'Prasad''s Multiplex • Screen 3',
        'Audi 3',
        'Hyderabad',
        'Necklace Road, NTR Gardens, Hyderabad',
        NOW() + INTERVAL '8 days',
        '06:00 PM',
        '/banners/theater-audi.svg',
        'U/A (All Ages Welcome)',
        'Outside food/beverages strictly prohibited by cinema management.',
        'general_admission',
        TRUE
    ) RETURNING id INTO v_event2_id;

    -- Tiers for Event 2 (Theater)
    INSERT INTO public.ticket_tiers (event_id, tier_name, price, total_capacity, description) VALUES
    (v_event2_id, 'Balcony Pass', 299.00, 180, 'Balcony elevated cinema seating'),
    (v_event2_id, 'First Class / Stalls', 199.00, 220, 'Main theater hall center seating'),
    (v_event2_id, 'VIP Recliner Row', 549.00, 24, 'Luxury leather recliner row + popcorn combo');

    -- 4. Insert Event 3: Sunset Acoustic Rooftop
    INSERT INTO public.events (
        organizer_id, slug, title, description, category, venue_type,
        venue_name, city, address, event_date, gates_open,
        poster_url, age_restriction, cover_charge_note, is_published
    ) VALUES (
        v_org_id,
        'sunset-indie-acoustic-rooftop',
        'Sunset Unplugged // Indie & Chai Session',
        'Intimate acoustic music, golden hour coffee, and indie songwriting under the open evening sky.',
        'acoustic',
        'rooftop',
        'Skyline Terrace Lounge',
        'Hyderabad',
        'Road No 36, Jubilee Hills, Hyderabad',
        NOW() + INTERVAL '12 days',
        '05:30 PM',
        '/banners/acoustic-sunset.svg',
        '18+',
        'Entry includes 1 complimentary artisanal hot beverage.',
        TRUE
    ) RETURNING id INTO v_event3_id;

    -- Tiers for Event 3
    INSERT INTO public.ticket_tiers (event_id, tier_name, price, total_capacity, description) VALUES
    (v_event3_id, 'Solo Sunset Pass', 299.00, 60, 'Single entry + welcome hot beverage'),
    (v_event3_id, 'Duo Pass', 499.00, 40, 'Couple or friends entry for two');

END $$;
