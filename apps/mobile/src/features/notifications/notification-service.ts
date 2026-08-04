import { assertBackendWritesEnabled } from '@/config/feature-flags';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

export type NotificationPreferences = {
  rsvpEnabled: boolean;
  mediaEnabled: boolean;
};

function decodePreferences(value: unknown): NotificationPreferences {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  // Defaults are on: someone who published an invitation wants to know when a
  // guest answers it, and the server treats a missing row the same way.
  return {
    mediaEnabled: source.mediaEnabled !== false,
    rsvpEnabled: source.rsvpEnabled !== false,
  };
}

export async function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  assertBackendWritesEnabled();
  const { error } = await requireSupabaseClient().rpc('register_push_token', {
    p_platform: platform,
    p_token: token,
  });
  if (error) throw new RemoteDataError('Bildirim kaydı yapılamadı.', error);
}

export async function unregisterPushToken(token: string): Promise<void> {
  const { error } = await requireSupabaseClient().rpc('unregister_push_token', { p_token: token });
  if (error) throw new RemoteDataError('Bildirim kaydı kaldırılamadı.', error);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data, error } = await requireSupabaseClient().rpc('get_notification_preferences');
  if (error) throw new RemoteDataError('Bildirim tercihleri okunamadı.', error);
  return decodePreferences(data);
}

export async function setNotificationPreferences(next: NotificationPreferences): Promise<NotificationPreferences> {
  assertBackendWritesEnabled();
  const { data, error } = await requireSupabaseClient().rpc('set_notification_preferences', {
    p_media_enabled: next.mediaEnabled,
    p_rsvp_enabled: next.rsvpEnabled,
  });
  if (error) throw new RemoteDataError('Bildirim tercihleri kaydedilemedi.', error);
  return decodePreferences(data);
}

export const __testing = { decodePreferences };
