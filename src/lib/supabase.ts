import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// createClient does not connect to the network on initialization,
// so empty string fallbacks are safe during the build phase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

