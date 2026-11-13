-- ====================================================================
-- SCENEO PRODUCTION DATABASE SCHEMA (Supabase PostgreSQL)
-- Multi-Venue: Auditoriums, Theaters, Community Halls & Cultural Spaces
-- Features: 5.5% Platform Fee, Pure Agent Splitting, Atomic Locking, Gate Scanner
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZERS TABLE
CREATE TABLE IF NOT EXISTS public.organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    upi_id TEXT NOT NULL,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    staff_scanner_pin TEXT DEFAULT '8421',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES public.organizers(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'music', -- 'screening', 'music', 'workshop', 'theater', 'cultural', 'acoustic'
    venue_type TEXT NOT NULL DEFAULT 'auditorium' CHECK (venue_type IN ('auditorium', 'theater', 'hall', 'rooftop', 'cultural_center', 'studio', 'open_air', 'club', 'warehouse')),
    venue_name TEXT NOT NULL,
    audi_screen_number TEXT, -- For movie theaters: e.g. 'Audi 3', 'Screen 2'
    city TEXT NOT NULL DEFAULT 'Hyderabad',
    address TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    gates_open TEXT DEFAULT '7:00 PM',
    poster_url TEXT,
    age_restriction TEXT DEFAULT '21+', -- '21+', '18+', 'U/A', 'U', 'All Ages'
    cover_charge_note TEXT DEFAULT 'Entry pass only. Venue cover charges (if any) payable at door.',
    outside_food_allowed BOOLEAN DEFAULT FALSE,
    seat_allocation_mode TEXT DEFAULT 'general_admission' CHECK (seat_allocation_mode IN ('general_admission', 'assigned_seating')),
    refund_cutoff_hours INT DEFAULT 24,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TICKET TIERS TABLE
CREATE TABLE IF NOT EXISTS public.ticket_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    tier_name TEXT NOT NULL, -- 'Balcony Pass', 'Stalls', 'Recliners', 'Early Bird', 'Phase 1', 'VIP Pass'
    price NUMERIC(10, 2) NOT NULL,
    total_capacity INT NOT NULL,
    sold_count INT NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT inventory_check CHECK (sold_count <= total_capacity)
);

-- 5. ORDERS TABLE (Captures 5.5% Platform Fee & Cashfree Reference)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- e.g. 'SC-2026-9812'
    event_id UUID REFERENCES public.events(id),
    tier_id UUID REFERENCES public.ticket_tiers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    quantity INT NOT NULL DEFAULT 1,
    ticket_price NUMERIC(10, 2) NOT NULL,       -- Base face-value amount (100% to host)
    convenience_fee NUMERIC(10, 2) NOT NULL,    -- max(15, 5.5%) SceneO platform fee
    total_paid NUMERIC(10, 2) NOT NULL,         -- Ticket Price + Convenience Fee
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    cashfree_order_id TEXT,
    cashfree_payment_id TEXT,
    split_payout_id TEXT,
    host_payout_status TEXT DEFAULT 'SCHEDULED_T1' CHECK (host_payout_status IN ('SCHEDULED_T1', 'SETTLED', 'HOLD')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PASSES TABLE (Anti-Screenshot Dynamic Token with Assigned Seat)
CREATE TABLE IF NOT EXISTS public.passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    pass_token TEXT UNIQUE NOT NULL,      -- Human-readable shortcode: e.g. 'SC-F14-8842'
    totp_secret TEXT NOT NULL,            -- Secret key for 30-second rotating QR token
    assigned_seat TEXT,                   -- 'Audi 3 • Row F • Seat 14' or 'Balcony (Open Seating)'
    is_checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_pin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ATOMIC INVENTORY RESERVATION (Prevents Flash Sale Overbooking)
CREATE OR REPLACE FUNCTION reserve_tickets_atomic(
    p_tier_id UUID,
    p_quantity INT
) RETURNS BOOLEAN AS $$
DECLARE
    v_available INT;
BEGIN
    SELECT (total_capacity - sold_count) INTO v_available
    FROM public.ticket_tiers
    WHERE id = p_tier_id AND is_active = TRUE
    FOR UPDATE;

    IF v_available >= p_quantity THEN
        UPDATE public.ticket_tiers
        SET sold_count = sold_count + p_quantity
        WHERE id = p_tier_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent duplicate errors
DROP POLICY IF EXISTS "Public Read Organizers" ON public.organizers;
DROP POLICY IF EXISTS "Public Insert Organizers" ON public.organizers;
DROP POLICY IF EXISTS "Public Read Published Events" ON public.events;
DROP POLICY IF EXISTS "Public Insert Events" ON public.events;
DROP POLICY IF EXISTS "Public Read Active Ticket Tiers" ON public.ticket_tiers;
DROP POLICY IF EXISTS "Public Insert Ticket Tiers" ON public.ticket_tiers;
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Update Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Passes" ON public.passes;
DROP POLICY IF EXISTS "Public Insert Passes" ON public.passes;
DROP POLICY IF EXISTS "Public Update Passes" ON public.passes;

-- ORGANIZERS POLICIES
CREATE POLICY "Public Read Organizers" 
ON public.organizers FOR SELECT USING (TRUE);

CREATE POLICY "Public Insert Organizers" 
ON public.organizers FOR INSERT WITH CHECK (TRUE);

-- EVENTS POLICIES
CREATE POLICY "Public Read Published Events" 
ON public.events FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public Insert Events" 
ON public.events FOR INSERT WITH CHECK (TRUE);

-- TICKET TIERS POLICIES
CREATE POLICY "Public Read Active Ticket Tiers" 
ON public.ticket_tiers FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public Insert Ticket Tiers" 
ON public.ticket_tiers FOR INSERT WITH CHECK (TRUE);

-- ORDERS POLICIES
CREATE POLICY "Public Read Orders" 
ON public.orders FOR SELECT USING (TRUE);

CREATE POLICY "Public Insert Orders" 
ON public.orders FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Public Update Orders" 
ON public.orders FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- PASSES POLICIES
CREATE POLICY "Public Read Passes" 
ON public.passes FOR SELECT USING (TRUE);

CREATE POLICY "Public Insert Passes" 
ON public.passes FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Public Update Passes" 
ON public.passes FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- 9. IMMUTABLE SECURITY & AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,         -- 'PAYMENT_CONFIRMED', 'WEBHOOK_SIGNATURE_MISMATCH', 'GATE_PASS_CHECKED_IN', 'GATE_INVALID_PIN_ATTEMPT', 'ADMIN_LOGIN_SUCCESS', 'ADMIN_LOGIN_FAILED'
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    actor_type TEXT DEFAULT 'SYSTEM' CHECK (actor_type IN ('SYSTEM', 'ADMIN', 'ORGANIZER', 'ATTENDEE', 'WEBHOOK', 'GATE_STAFF')),
    actor_id TEXT,                    -- Phone, Admin Session, or Staff PIN
    entity_type TEXT,                 -- 'ORDER', 'PASS', 'EVENT', 'AUTH'
    entity_id TEXT,                   -- ID of affected pass, order, or event
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Insert Security Logs" ON public.security_logs;
DROP POLICY IF EXISTS "Allow Read Security Logs" ON public.security_logs;

-- Append-only: INSERT and SELECT allowed. NO UPDATE or DELETE allowed (Tamper-Proof)
CREATE POLICY "Allow Insert Security Logs" 
ON public.security_logs FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow Read Security Logs" 
ON public.security_logs FOR SELECT USING (TRUE);
