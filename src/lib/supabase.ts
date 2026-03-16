import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only initialize if we have the required environment variables
// This prevents build-time crashes when variables are missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = (supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null) as any;
