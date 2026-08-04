import type {
  Guest,
  GuestMediaUpload,
  Invitation,
  InvitationMedia,
  InvitationStatus,
  InvitationTemplate,
  JsonObject,
  MediaContext,
  MediaKind,
  MediaStatus,
  PublicInvitation,
  PublicRsvpContext,
  PublicRsvpGuest,
  RsvpStatus,
  TemplateTier,
} from '@/domain/models';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function number(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function object(value: unknown): JsonObject {
  return isRecord(value) ? value : {};
}

function list(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function stringList(value: unknown) {
  return list(value).filter((item): item is string => typeof item === 'string');
}

function invitationStatus(value: unknown): InvitationStatus {
  return value === 'published' || value === 'archived' ? value : 'draft';
}

function templateTier(value: unknown): TemplateTier {
  return value === 'pro' || value === 'premium' ? value : 'free';
}

// The database enum still carries two labels the web client wrote and mobile
// never does. `not_attending` is a decline, so folding it into `pending` would
// show a guest who already said no as still awaiting a reply. `maybe` has no
// mobile equivalent and genuinely is undecided.
function rsvpStatus(value: unknown): RsvpStatus {
  if (value === 'attending' || value === 'declined') return value;
  if (value === 'not_attending') return 'declined';
  return 'pending';
}

// `event_time` is a `time` column, so Postgres returns "19:30:00". The editor
// writes and displays HH:MM, and round-tripping the seconds back through the
// field would show the user something they never typed.
function clockTime(value: unknown) {
  const text = nullableText(value);
  return text && /^\d{1,2}:\d{2}:\d{2}$/.test(text) ? text.slice(0, -3) : text;
}

function mediaKind(value: unknown): MediaKind {
  return value === 'video' ? 'video' : 'image';
}

function mediaStatus(value: unknown): MediaStatus {
  return value === 'expired' || value === 'deleted' || value === 'processing' ? value : 'active';
}

function invitationFields(value: Record<string, unknown>) {
  return {
    id: text(value.id),
    templateId: nullableText(value.template_id),
    title: text(value.title, 'İsimsiz davet'),
    slug: text(value.slug),
    eventType: nullableText(value.event_type),
    eventDate: nullableText(value.event_date),
    eventTime: clockTime(value.event_time),
    eventLocationName: nullableText(value.event_location_name),
    eventLocationAddress: nullableText(value.event_location_address),
    customDesign: object(value.custom_design),
    content: object(value.content),
    settings: object(value.settings),
    status: invitationStatus(value.status),
    isPublic: value.is_public === true,
    viewCount: number(value.view_count),
    rsvpCount: number(value.rsvp_count),
    imageUrl: nullableText(value.image_url),
    publishedAt: nullableText(value.published_at),
    createdAt: text(value.created_at),
    updatedAt: text(value.updated_at),
  };
}

export function decodeInvitation(value: unknown): Invitation | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const userId = text(value.user_id);
  if (!id || !userId) return null;

  return {
    ...invitationFields(value),
    id,
    userId,
  };
}

export function decodePublicInvitation(value: unknown): PublicInvitation | null {
  if (!isRecord(value)) return null;
  const fields = invitationFields(value);
  if (!fields.id || fields.status !== 'published' || !fields.isPublic) return null;
  return fields;
}

export function decodeGuest(value: unknown): Guest | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const invitationId = text(value.invitation_id);
  const fullName = text(value.full_name);
  const guestToken = text(value.guest_token);
  if (!id || !invitationId || !fullName || !guestToken) return null;

  return {
    id,
    invitationId,
    fullName,
    email: nullableText(value.email),
    phone: nullableText(value.phone),
    rsvpStatus: rsvpStatus(value.rsvp_status),
    companionCount: Math.max(0, Math.floor(number(value.companion_count))),
    dietaryRestrictions: nullableText(value.dietary_restrictions),
    notes: nullableText(value.notes),
    respondedAt: nullableText(value.rsvp_responded_at),
    guestToken,
    createdAt: text(value.created_at),
    updatedAt: text(value.updated_at),
  };
}

function decodePublicRsvpGuest(value: unknown): PublicRsvpGuest | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const invitationId = text(value.invitation_id);
  const fullName = text(value.full_name);
  if (!id || !invitationId || !fullName) return null;
  return {
    id,
    invitationId,
    fullName,
    rsvpStatus: rsvpStatus(value.rsvp_status),
    companionCount: Math.max(0, Math.floor(number(value.companion_count))),
    dietaryRestrictions: nullableText(value.dietary_restrictions),
    notes: nullableText(value.notes),
    respondedAt: nullableText(value.rsvp_responded_at),
  };
}

export function decodePublicRsvpContext(value: unknown): PublicRsvpContext | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!isRecord(candidate)) return null;
  const source = candidate;
  const guest = decodePublicRsvpGuest(source.guest);
  const invitation = decodePublicInvitation(source.invitation);
  return guest && invitation ? { guest, invitation } : null;
}

export function decodeTemplate(value: unknown): InvitationTemplate | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const name = text(value.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    description: nullableText(value.description),
    category: text(value.category, 'Diğer'),
    subcategory: nullableText(value.subcategory),
    tier: templateTier(value.tier),
    thumbnailUrl: nullableText(value.thumbnail_url),
    defaultImageUrl: nullableText(value.default_image_url),
    colorPalette: object(value.color_palette),
    textFields: list(value.text_fields),
    decorativeElements: list(value.decorative_elements),
    availableFonts: stringList(value.available_fonts),
    isFeatured: value.is_featured === true,
    sortOrder: number(value.sort_order),
    updatedAt: text(value.updated_at),
  };
}

export function decodeInvitationMedia(value: unknown): InvitationMedia | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const invitationId = text(value.invitation_id);
  const qrCode = text(value.qr_code);
  if (!id || !invitationId || !qrCode) return null;

  return {
    id,
    invitationId,
    type: mediaKind(value.type),
    fileName: text(value.file_name),
    fileSize: Math.max(0, number(value.file_size)),
    mimeType: text(value.mime_type),
    signedUrl: nullableText(value.signed_url),
    qrCode,
    title: nullableText(value.title),
    description: nullableText(value.description),
    expiresAt: nullableText(value.expires_at),
    viewCount: Math.max(0, number(value.view_count)),
    scanCount: Math.max(0, number(value.scan_count)),
    allowGuestUpload: value.allow_guest_upload === true,
    guestUploadsLimit: Math.max(0, Math.floor(number(value.guest_uploads_limit))),
    guestUploadsCount: Math.max(0, Math.floor(number(value.guest_uploads_count))),
    status: mediaStatus(value.status),
    createdAt: text(value.created_at),
    updatedAt: text(value.updated_at),
  };
}

export function decodeGuestMediaUpload(value: unknown): GuestMediaUpload | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const mediaId = text(value.media_id);
  if (!id || !mediaId) return null;
  return {
    id,
    mediaId,
    guestName: nullableText(value.guest_name),
    note: nullableText(value.note),
    type: mediaKind(value.type),
    fileName: text(value.file_name),
    fileSize: Math.max(0, number(value.file_size)),
    mimeType: text(value.mime_type),
    signedUrl: nullableText(value.signed_url),
    createdAt: text(value.created_at),
  };
}

export function decodeMediaContext(value: unknown): MediaContext | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!isRecord(candidate)) return null;
  const media = decodeInvitationMedia(candidate.media);
  if (!media) return null;
  return {
    media,
    uploads: list(candidate.uploads)
      .map(decodeGuestMediaUpload)
      .filter((item): item is GuestMediaUpload => item !== null),
  };
}
