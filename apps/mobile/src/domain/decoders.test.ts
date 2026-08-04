import { describe, expect, it } from 'vitest';

import { decodeGuest, decodeMediaContext, decodePublicInvitation } from '@/domain/decoders';

const invitation = {
  id: 'invitation-1',
  is_public: true,
  status: 'published',
  title: 'Test daveti',
};

describe('public decoders', () => {
  it('does not expose a draft invitation', () => {
    expect(decodePublicInvitation({ ...invitation, status: 'draft' })).toBeNull();
  });

  it('accepts only valid media rows in the public context', () => {
    const context = decodeMediaContext({
      media: { id: 'media-1', invitation_id: 'invitation-1', qr_code: 'safe-code', status: 'active' },
      uploads: [
        { id: 'upload-1', media_id: 'media-1', file_name: 'photo.jpg', type: 'image' },
        { id: '', media_id: 'media-1' },
      ],
    });
    expect(context?.media.qrCode).toBe('safe-code');
    expect(context?.uploads).toHaveLength(1);
  });

  it('drops the seconds Postgres adds to a time column', () => {
    expect(decodePublicInvitation({ ...invitation, event_time: '19:30:00' })?.eventTime).toBe('19:30');
    expect(decodePublicInvitation({ ...invitation, event_time: '19:30' })?.eventTime).toBe('19:30');
  });
});

describe('guest decoder', () => {
  const guest = {
    id: 'guest-1',
    invitation_id: 'invitation-1',
    full_name: 'Test Davetli',
    guest_token: 'token-1',
  };

  it('reads a legacy not_attending row as a decline, not as awaiting a reply', () => {
    expect(decodeGuest({ ...guest, rsvp_status: 'not_attending' })?.rsvpStatus).toBe('declined');
  });

  it('treats the legacy maybe row as undecided', () => {
    expect(decodeGuest({ ...guest, rsvp_status: 'maybe' })?.rsvpStatus).toBe('pending');
  });
});
