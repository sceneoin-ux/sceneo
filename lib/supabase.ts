import { createClient } from "@supabase/supabase-js";

if (process.env.NODE_ENV !== "production") {
  // Allow local development on Windows Node.js without certificate chain errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
