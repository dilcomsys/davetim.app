
import { assertBackendWritesEnabled } from '@/config/feature-flags';
import { decodeMediaContext } from '@/domain/decoders';
import type { MediaContext, MediaKind } from '@/domain/models';
// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { readFileBytes } from '@/lib/local-file';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

export type LocalMediaFile = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uri: string;
};

type UploadTicket = {
  bucket: string;
  path: string;
  ticketId: string;
  token: string;
};

function decodeUploadTicket(value: unknown): UploadTicket | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.bucket !== 'string' ||
    typeof candidate.path !== 'string' ||
    typeof candidate.ticketId !== 'string' ||
    typeof candidate.token !== 'string'
  ) return null;
  return candidate as UploadTicket;
}

export function validateLocalMedia(file: LocalMediaFile): MediaKind {
  const isImage = ALLOWED_IMAGE_TYPES.has(file.mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.mimeType);
  if (!isImage && !isVideo) throw new RemoteDataError('Yalnızca JPG, PNG, WebP, HEIC, MP4, MOV veya WebM dosyaları yüklenebilir.');
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!Number.isFinite(file.fileSize) || file.fileSize <= 0 || file.fileSize > limit) {
    throw new RemoteDataError(isVideo ? 'Video en fazla 100 MB olabilir.' : 'Görsel en fazla 10 MB olabilir.');
  }
  return isVideo ? 'video' : 'image';
}

// Media reads go through an Edge Function rather than an RPC because the
// response carries short-lived signed URLs, and only the server may mint them.
export async function getOwnerMediaContext(invitationId: string): Promise<MediaContext | null> {
  const { data, error } = await requireSupabaseClient().functions.invoke('media-context', {
    body: { invitationId, scope: 'owner' },
  });
  if (error) throw new RemoteDataError('QR medya bilgileri yüklenemedi.', error);
  if (data === null) return null;
  const context = decodeMediaContext(data);
  if (!context) throw new RemoteDataError('QR medya yanıtı doğrulanamadı.');
  return context;
}

export async function getPublicMediaContext(qrCode: string): Promise<MediaContext> {
  const { data, error } = await requireSupabaseClient().functions.invoke('media-context', {
    body: { qrCode, scope: 'public' },
  });
  if (error) throw new RemoteDataError('Galeri bağlantısı doğrulanamadı.', error);
  const context = decodeMediaContext(data);
  if (!context || context.media.status !== 'active') throw new RemoteDataError('Galeri bulunamadı veya erişim süresi dolmuş.');
  return context;
}

async function uploadWithTicket(file: LocalMediaFile, request: Record<string, unknown>): Promise<void> {
  assertBackendWritesEnabled();
  const kind = validateLocalMedia(file);
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.functions.invoke('media-upload-ticket', {
    body: {
      ...request,
      fileName: file.fileName,
      fileSize: file.fileSize,
      kind,
      mimeType: file.mimeType,
    },
  });
  if (error) throw new RemoteDataError('Güvenli yükleme izni alınamadı.', error);
  const ticket = decodeUploadTicket(data);
  if (!ticket) throw new RemoteDataError('Yükleme izni yanıtı geçersiz.');

  const bytes = await readFileBytes(file.uri);
  const { error: uploadError } = await supabase.storage
    .from(ticket.bucket)
    .uploadToSignedUrl(ticket.path, ticket.token, bytes, {
      contentType: file.mimeType,
    });
  if (uploadError) throw new RemoteDataError('Dosya yüklenemedi.', uploadError);

  const { error: completeError } = await supabase.functions.invoke('complete-media-upload', {
    body: { ticketId: ticket.ticketId },
  });
  if (completeError) throw new RemoteDataError('Yükleme kaydı tamamlanamadı.', completeError);
}

export async function uploadOwnerMedia(input: LocalMediaFile & { invitationId: string; title: string }): Promise<void> {
  await uploadWithTicket(input, {
    invitationId: input.invitationId,
    scope: 'owner',
    title: input.title.trim() || null,
  });
}

export async function uploadGuestMedia(input: LocalMediaFile & { consent: boolean; guestName: string; note: string; qrCode: string }): Promise<void> {
  if (!input.consent) throw new RemoteDataError('Yükleme için içerik paylaşım onayını vermelisiniz.');
  await uploadWithTicket(input, {
    consent: true,
    guestName: input.guestName.trim() || null,
    note: input.note.trim() || null,
    qrCode: input.qrCode,
    scope: 'guest',
  });
}

export async function setGuestUploadsAllowed(mediaId: string, allowed: boolean): Promise<void> {
  assertBackendWritesEnabled();
  const { error } = await requireSupabaseClient().rpc('update_media_settings', {
    p_allow_guest_upload: allowed,
    p_media_id: mediaId,
  });
  if (error) throw new RemoteDataError('Galeri ayarı güncellenemedi.', error);
}

export async function deleteGuestMedia(uploadId: string): Promise<void> {
  assertBackendWritesEnabled();
  const { error } = await requireSupabaseClient().functions.invoke('delete-media-object', {
    body: { scope: 'guest', uploadId },
  });
  if (error) throw new RemoteDataError('Medya silinemedi.', error);
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
