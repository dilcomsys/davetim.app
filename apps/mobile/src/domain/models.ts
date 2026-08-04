export type JsonObject = Record<string, unknown>;

export type InvitationStatus = 'draft' | 'published' | 'archived';

export type Invitation = {
  id: string;
  userId: string;
  templateId: string | null;
  title: string;
  slug: string;
  eventType: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocationName: string | null;
  eventLocationAddress: string | null;
  customDesign: JsonObject;
  content: JsonObject;
  settings: JsonObject;
  status: InvitationStatus;
  isPublic: boolean;
  viewCount: number;
  rsvpCount: number;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TemplateTier = 'free' | 'pro' | 'premium';

export type InvitationTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  tier: TemplateTier;
  thumbnailUrl: string | null;
  defaultImageUrl: string | null;
  colorPalette: JsonObject;
  textFields: unknown[];
  decorativeElements: unknown[];
  availableFonts: string[];
  isFeatured: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type PublicInvitation = Omit<Invitation, 'userId'>;

export type RsvpStatus = 'pending' | 'attending' | 'declined';

export type Guest = {
  id: string;
  invitationId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  rsvpStatus: RsvpStatus;
  companionCount: number;
  dietaryRestrictions: string | null;
  notes: string | null;
  respondedAt: string | null;
  guestToken: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicRsvpGuest = Omit<Guest, 'email' | 'phone' | 'guestToken' | 'createdAt' | 'updatedAt'>;

export type PublicRsvpContext = {
  guest: PublicRsvpGuest;
  invitation: PublicInvitation;
};

export type MediaKind = 'image' | 'video';
export type MediaStatus = 'active' | 'expired' | 'deleted' | 'processing';

export type InvitationMedia = {
  id: string;
  invitationId: string;
  type: MediaKind;
  fileName: string;
  fileSize: number;
  mimeType: string;
  signedUrl: string | null;
  qrCode: string;
  title: string | null;
  description: string | null;
  expiresAt: string | null;
  viewCount: number;
  scanCount: number;
  allowGuestUpload: boolean;
  guestUploadsLimit: number;
  guestUploadsCount: number;
  status: MediaStatus;
  createdAt: string;
  updatedAt: string;
};

export type GuestMediaUpload = {
  id: string;
  mediaId: string;
  guestName: string | null;
  note: string | null;
  type: MediaKind;
  fileName: string;
  fileSize: number;
  mimeType: string;
  signedUrl: string | null;
  createdAt: string;
};

export type MediaContext = {
  media: InvitationMedia;
  uploads: GuestMediaUpload[];
};
