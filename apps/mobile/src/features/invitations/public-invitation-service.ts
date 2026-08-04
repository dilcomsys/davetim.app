import { decodePublicInvitation } from '@/domain/decoders';
import type { PublicInvitation } from '@/domain/models';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

export async function getPublicInvitation(invitationId: string): Promise<PublicInvitation> {
  const { data, error } = await requireSupabaseClient().rpc('get_public_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) throw new RemoteDataError('Davet yüklenemedi.', error);
  const invitation = decodePublicInvitation(data);
  if (!invitation) throw new RemoteDataError('Bu davet bulunamadı veya yayında değil.');
  return invitation;
}
