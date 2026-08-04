import { Platform } from 'react-native';

import type { ReleaseInfo } from '@/features/prompts/prompt-decision';
import { getSupabaseClient } from '@/lib/supabase';

/*
 * Reads this platform's release row.
 *
 * Every failure returns null rather than throwing. A prompt is an interruption
 * the app chooses to make; if the check cannot be completed — offline, table
 * missing, Supabase unconfigured — the correct behaviour is to interrupt
 * nobody, not to surface an error about a background check the user never
 * asked for.
 */
export async function fetchRelease(): Promise<ReleaseInfo | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    const { data, error } = await supabase
      .from('app_releases')
      .select('latest_version,min_supported_version,store_url,notes')
      .eq('platform', platform)
      .maybeSingle();

    if (error || !data) return null;

    return {
      latestVersion: typeof data.latest_version === 'string' ? data.latest_version : null,
      minSupportedVersion: typeof data.min_supported_version === 'string' ? data.min_supported_version : null,
      notes: typeof data.notes === 'string' && data.notes.length > 0 ? data.notes : null,
      storeUrl: typeof data.store_url === 'string' && data.store_url.length > 0 ? data.store_url : null,
    };
  } catch {
    return null;
  }
}
