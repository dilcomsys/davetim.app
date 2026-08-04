import { assertBackendWritesEnabled } from '@/config/feature-flags';
import { decodeGuest, decodePublicRsvpContext } from '@/domain/decoders';
import type { Guest, PublicRsvpContext, RsvpStatus } from '@/domain/models';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

const GUEST_COLUMNS = [
  'id',
  'invitation_id',
  'full_name',
  'email',
  'phone',
  'rsvp_status',
  'companion_count',
  'dietary_restrictions',
  'notes',
  'rsvp_responded_at',
  'guest_token',
  'created_at',
  'updated_at',
].join(',');

export async function listGuests(invitationId: string): Promise<Guest[]> {
  const { data, error } = await requireSupabaseClient()
    .from('guests')
    .select(GUEST_COLUMNS)
    .eq('invitation_id', invitationId)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw new RemoteDataError('Davetli listesi yüklenemedi.', error);
  return (data ?? []).map(decodeGuest).filter((item): item is Guest => item !== null);
}

export async function getPublicRsvpContext(guestToken: string): Promise<PublicRsvpContext> {
  const { data, error } = await requireSupabaseClient().rpc('get_public_rsvp_context', {
    p_guest_token: guestToken,
  });
  if (error) throw new RemoteDataError('RSVP bağlantısı doğrulanamadı.', error);
  const context = decodePublicRsvpContext(data);
  if (!context) throw new RemoteDataError('RSVP bağlantısı geçersiz veya süresi dolmuş.');
  return context;
}

export async function submitRsvp(input: {
  companionCount: number;
  dietaryRestrictions: string;
  guestToken: string;
  notes: string;
  status: Exclude<RsvpStatus, 'pending'>;
}): Promise<PublicRsvpContext> {
  assertBackendWritesEnabled();
  const { data, error } = await requireSupabaseClient().rpc('submit_guest_rsvp', {
    p_companion_count: Math.max(0, Math.min(20, Math.floor(input.companionCount))),
    p_dietary_restrictions: input.dietaryRestrictions.trim() || null,
    p_guest_token: input.guestToken,
    p_notes: input.notes.trim() || null,
    p_status: input.status,
  });
  if (error) throw new RemoteDataError('Yanıt kaydedilemedi. Lütfen tekrar deneyin.', error);
  const context = decodePublicRsvpContext(data);
  if (!context) throw new RemoteDataError('Kaydedilen yanıt doğrulanamadı.');
  return context;
}

export async function manageGuest(input: {
  action: 'create' | 'update' | 'delete';
  email?: string;
  fullName?: string;
  guestId?: string;
  invitationId: string;
  phone?: string;
}): Promise<void> {
  assertBackendWritesEnabled();
  const { error } = await requireSupabaseClient().rpc('manage_invitation_guest', {
    p_action: input.action,
    p_email: input.email?.trim() || null,
    p_full_name: input.fullName?.trim() || null,
    p_guest_id: input.guestId ?? null,
    p_invitation_id: input.invitationId,
    p_phone: input.phone?.trim() || null,
  });
  if (error) throw new RemoteDataError('Davetli işlemi tamamlanamadı.', error);
}

export async function bulkImportGuests(invitationId: string, guests: { email: string | null; fullName: string; phone: string | null }[]): Promise<void> {
  assertBackendWritesEnabled();
  if (guests.length === 0 || guests.length > 500) throw new RemoteDataError('Bir dosyada 1 ile 500 arasında davetli bulunmalıdır.');
  const { error } = await requireSupabaseClient().rpc('bulk_import_invitation_guests', {
    p_guests: guests.map((guest) => ({ email: guest.email, full_name: guest.fullName, phone: guest.phone })),
    p_invitation_id: invitationId,
  });
  if (error) throw new RemoteDataError('Davetliler içe aktarılamadı.', error);
}
