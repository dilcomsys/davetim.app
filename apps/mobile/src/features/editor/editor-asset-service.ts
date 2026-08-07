
import { assertBackendWritesEnabled } from '@/config/feature-flags';
import type { LocalMediaFile } from '@/features/media/media-service';
import { validateLocalMedia } from '@/features/media/media-service';
// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { readFileBytes } from '@/lib/local-file';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export async function uploadInvitationImage(file: LocalMediaFile, invitationId?: string) {
  assertBackendWritesEnabled();
  if (validateLocalMedia(file) !== 'image') throw new RemoteDataError('Davet tasarımında yalnızca görsel kullanılabilir.');
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.functions.invoke('invitation-image-upload-ticket', {
    body: {
      fileName: file.fileName,
      fileSize: file.fileSize,
      invitationId: invitationId ?? null,
      mimeType: file.mimeType,
    },
  });
  if (error) throw new RemoteDataError('Görsel yükleme izni alınamadı.', error);
  const ticket = record(data);
  if (!ticket || typeof ticket.bucket !== 'string' || typeof ticket.path !== 'string' || typeof ticket.token !== 'string' || typeof ticket.ticketId !== 'string') {
    throw new RemoteDataError('Görsel yükleme izni geçersiz.');
  }
  const bytes = await readFileBytes(file.uri);
  const { error: uploadError } = await supabase.storage.from(ticket.bucket).uploadToSignedUrl(ticket.path, ticket.token, bytes, { contentType: file.mimeType });
  if (uploadError) throw new RemoteDataError('Görsel yüklenemedi.', uploadError);
  const { data: completed, error: completeError } = await supabase.functions.invoke('complete-invitation-image-upload', { body: { ticketId: ticket.ticketId } });
  if (completeError) throw new RemoteDataError('Görsel kaydı tamamlanamadı.', completeError);
  const result = record(completed);
  if (!result || typeof result.publicUrl !== 'string' || !result.publicUrl.startsWith('https://')) throw new RemoteDataError('Görsel adresi doğrulanamadı.');
  return result.publicUrl;
}
