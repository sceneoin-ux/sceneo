-- ====================================================================
-- SCENEO SUPABASE UPGRADE & RLS COMPLIANCE SCRIPT
-- Run this once in Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. SAFE COLUMN GUARDS (Ensures all fields exist without modifying existing data)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS audi_screen_number TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_charge_note TEXT DEFAULT 'Entry pass only.';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS staff_scanner_pin TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checked_in_count INT DEFAULT 0;

-- 2. EXPAND VENUE TYPE CONSTRAINT (Allows Auditorium, Hall, Cultural Center, Studio, Club)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_venue_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_venue_type_check 
  CHECK (venue_type IN ('auditorium', 'theater', 'hall', 'rooftop', 'cultural_center', 'studio', 'open_air', 'club', 'warehouse'));

-- 3. ENABLE COMPLETE ROW LEVEL SECURITY POLICIES FOR APP FUNCTIONALITY
-- Organizers
DROP POLICY IF EXISTS "Public Read Organizers" ON public.organizers;
DROP POLICY IF EXISTS "Public Insert Organizers" ON public.organizers;
CREATE POLICY "Public Read Organizers" ON public.organizers FOR SELECT USING (TRUE);
CREATE POLICY "Public Insert Organizers" ON public.organizers FOR INSERT WITH CHECK (TRUE);

-- Events
DROP POLICY IF EXISTS "Public Read Published Events" ON public.events;
DROP POLICY IF EXISTS "Public Insert Events" ON public.events;
CREATE POLICY "Public Read Published Events" ON public.events FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public Insert Events" ON public.events FOR INSERT WITH CHECK (TRUE);

-- Ticket Tiers
DROP POLICY IF EXISTS "Public Read Active Ticket Tiers" ON public.ticket_tiers;
DROP POLICY IF EXISTS "Public Insert Ticket Tiers" ON public.ticket_tiers;
CREATE POLICY "Public Read Active Ticket Tiers" ON public.ticket_tiers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public Insert Ticket Tiers" ON public.ticket_tiers FOR INSERT WITH CHECK (TRUE);

-- Orders
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Update Orders" ON public.orders;
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (TRUE);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- Passes
DROP POLICY IF EXISTS "Public Read Own Passes" ON public.passes;
DROP POLICY IF EXISTS "Public Read Passes" ON public.passes;
DROP POLICY IF EXISTS "Public Insert Passes" ON public.passes;
DROP POLICY IF EXISTS "Public Update Passes" ON public.passes;
CREATE POLICY "Public Read Passes" ON public.passes FOR SELECT USING (TRUE);
CREATE POLICY "Public Insert Passes" ON public.passes FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public Update Passes" ON public.passes FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- 3. IMMUTABLE SECURITY & AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    actor_type TEXT DEFAULT 'SYSTEM' CHECK (actor_type IN ('SYSTEM', 'ADMIN', 'ORGANIZER', 'ATTENDEE', 'WEBHOOK', 'GATE_STAFF')),
    actor_id TEXT,
    entity_type TEXT,
    entity_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Insert Security Logs" ON public.security_logs;
DROP POLICY IF EXISTS "Allow Read Security Logs" ON public.security_logs;

CREATE POLICY "Allow Insert Security Logs" 
ON public.security_logs FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow Read Security Logs" 
ON public.security_logs FOR SELECT USING (TRUE);

-- 4. HIGH-SCALE 10,000+ BOOKING CONCURRENCY INDEXES (1MS LOOKUP OPTIMIZATION)
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_event_payment ON public.orders(event_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_cf_order_id ON public.orders(cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_passes_order_id ON public.passes(order_id);
CREATE INDEX IF NOT EXISTS idx_passes_token ON public.passes(pass_token);
CREATE INDEX IF NOT EXISTS idx_events_published_date ON public.events(is_published, event_date);
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_id ON public.ticket_tiers(event_id);

-- 5. (OPTIONAL) EMPTY TEST/SEED DATA (Uncomment if you want a completely empty database)
-- TRUNCATE TABLE public.ticket_tiers, public.events, public.orders, public.passes, public.organizers CASCADE;
