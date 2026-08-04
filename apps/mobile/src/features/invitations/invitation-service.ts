import { decodeInvitation } from '@/domain/decoders';
import type { Invitation } from '@/domain/models';
import { assertBackendWritesEnabled } from '@/config/feature-flags';
import type { EditorDocument } from '@/features/editor/editor-model';
import { serializeEditorDocument } from '@/features/editor/editor-model';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

const INVITATION_COLUMNS = [
  'id',
  'user_id',
  'template_id',
  'title',
  'slug',
  'event_type',
  'event_date',
  'event_time',
  'event_location_name',
  'event_location_address',
  'custom_design',
  'content',
  'settings',
  'status',
  'is_public',
  'view_count',
  'rsvp_count',
  'image_url',
  'published_at',
  'created_at',
  'updated_at',
].join(',');

export async function listInvitations(userId: string): Promise<Invitation[]> {
  const { data, error } = await requireSupabaseClient()
    .from('invitations')
    .select(INVITATION_COLUMNS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) throw new RemoteDataError('Davetler yüklenemedi. Lütfen tekrar deneyin.', error);
  return (data ?? []).map(decodeInvitation).filter((item): item is Invitation => item !== null);
}

export async function getInvitationForOwner(invitationId: string, userId: string): Promise<Invitation> {
  const { data, error } = await requireSupabaseClient()
    .from('invitations')
    .select(INVITATION_COLUMNS)
    .eq('id', invitationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new RemoteDataError('Davet yüklenemedi. Lütfen tekrar deneyin.', error);
  const invitation = decodeInvitation(data);
  if (!invitation) throw new RemoteDataError('Davet bulunamadı veya bu daveti görme yetkiniz yok.');
  return invitation;
}

export async function createInvitationDraft(input: {
  document: EditorDocument;
  rewardReceiptId?: string;
  templateId: string | null;
}): Promise<Invitation> {
  assertBackendWritesEnabled();
  const { data, error } = await requireSupabaseClient().rpc('create_invitation_draft', {
    p_document: serializeEditorDocument(input.document),
    p_reward_receipt_id: input.rewardReceiptId ?? null,
    p_template_id: input.templateId,
  });
  if (error) throw new RemoteDataError('Davet taslağı oluşturulamadı.', error);
  const invitation = decodeInvitation(data);
  if (!invitation) throw new RemoteDataError('Oluşturulan davet okunamadı.');
  return invitation;
}

export async function saveInvitationDocument(invitationId: string, document: EditorDocument): Promise<Invitation> {
  assertBackendWritesEnabled();
  const { data, error } = await requireSupabaseClient().rpc('save_invitation_document', {
    p_document: serializeEditorDocument(document),
    p_invitation_id: invitationId,
  });
  if (error) throw new RemoteDataError('Davet kaydedilemedi.', error);
  const invitation = decodeInvitation(data);
  if (!invitation) throw new RemoteDataError('Kaydedilen davet okunamadı.');
  return invitation;
}

export async function setInvitationPublished(invitationId: string, publish: boolean): Promise<Invitation> {
  assertBackendWritesEnabled();
  const { data, error } = await requireSupabaseClient().rpc('set_invitation_publish_state', {
    p_invitation_id: invitationId,
    p_publish: publish,
  });
  if (error) throw new RemoteDataError('Yayın durumu güncellenemedi.', error);
  const invitation = decodeInvitation(data);
  if (!invitation) throw new RemoteDataError('Güncellenen davet okunamadı.');
  return invitation;
}

export async function manageInvitationLifecycle(invitationId: string, action: 'archive' | 'restore' | 'duplicate' | 'delete'): Promise<Invitation | null> {
  assertBackendWritesEnabled();
  const { data, error } = await requireSupabaseClient().rpc('manage_invitation_lifecycle', {
    p_action: action,
    p_invitation_id: invitationId,
  });
  if (error) throw new RemoteDataError('Davet işlemi tamamlanamadı.', error);
  if (action === 'delete') return null;
  const invitation = decodeInvitation(data);
  if (!invitation) throw new RemoteDataError('Güncellenen davet okunamadı.');
  return invitation;
}
