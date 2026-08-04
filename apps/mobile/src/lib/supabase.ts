import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { authStorage } from '@/lib/secure-auth-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export class SupabaseConfigurationError extends Error {
  constructor() {
    super('Supabase bağlantısı yapılandırılmamış. EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY değerlerini ekleyin.');
    this.name = 'SupabaseConfigurationError';
  }
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  client ??= createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      storage: authStorage,
    },
  });

  return client;
}

export function requireSupabaseClient(): SupabaseClient {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new SupabaseConfigurationError();
  }

  return supabase;
}
