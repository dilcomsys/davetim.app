import { describe, expect, it } from 'vitest';

import {
  invitationLink,
  inviteLinkList,
  inviteMessage,
  normalizePhone,
  rsvpLink,
  smsUrl,
  whatsappUrl,
} from '@/lib/guest-invite';

const ORIGIN = 'https://davetim.app';

describe('normalizePhone', () => {
  it('accepts the ways a Turkish mobile is actually written', () => {
    for (const written of [
      '0532 123 45 67',
      '05321234567',
      '+90 532 123 45 67',
      '+905321234567',
      '90 532 123 45 67',
      '(0532) 123-45-67',
      '532 123 45 67',
      '0090 532 123 45 67',
    ]) {
      expect(normalizePhone(written), written).toBe('905321234567');
    }
  });

  it('keeps a foreign number that came with a plus', () => {
    expect(normalizePhone('+44 20 7946 0958')).toBe('442079460958');
  });

  it('refuses what cannot be dialled', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('   ')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone('bilinmiyor')).toBeNull();
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhone('+12')).toBeNull();
  });
});

describe('rsvpLink', () => {
  it('builds a web link when the app has a public origin', () => {
    expect(rsvpLink('abc123', ORIGIN)).toBe('https://davetim.app/rsvp/abc123');
  });

  it('falls back to the app scheme without one', () => {
    expect(rsvpLink('abc123', null)).toBe('davetim://rsvp/abc123');
  });

  it('escapes a token that would otherwise break the path', () => {
    expect(rsvpLink('a/b?c', ORIGIN)).toBe('https://davetim.app/rsvp/a%2Fb%3Fc');
  });
});

describe('invitationLink', () => {
  it('points at the shared invitation page', () => {
    expect(invitationLink('inv-1', ORIGIN)).toBe('https://davetim.app/i/inv-1');
    expect(invitationLink('inv-1', null)).toBe('davetim://i/inv-1');
  });
});

describe('inviteMessage', () => {
  it('addresses the guest and carries the link', () => {
    const message = inviteMessage({
      eventDate: '12 Eylül 2026',
      guestName: 'Ayşe Yılmaz',
      link: 'https://davetim.app/rsvp/abc',
      title: 'Ayşe & Mehmet',
    });

    expect(message).toContain('Sayın Ayşe Yılmaz,');
    expect(message).toContain('Ayşe & Mehmet · 12 Eylül 2026');
    expect(message).toContain('https://davetim.app/rsvp/abc');
  });

  it('greets generically when there is no name to use', () => {
    expect(inviteMessage({ guestName: '   ', link: 'x', title: 'Düğün' })).toContain('Merhaba,');
  });

  it('leaves out the date rather than trailing a separator', () => {
    const message = inviteMessage({ eventDate: null, guestName: 'Ali', link: 'x', title: 'Düğün' });

    expect(message).toContain('Düğün davetimize');
    expect(message).not.toContain('·');
  });
});

describe('whatsappUrl', () => {
  it('opens a chat with the message already written', () => {
    const url = whatsappUrl('0532 123 45 67', 'Merhaba & hoş geldiniz');

    expect(url).toContain('https://wa.me/905321234567?text=');
    expect(url).toContain('Merhaba%20%26%20');
  });

  it('is null when there is no usable number', () => {
    expect(whatsappUrl('', 'x')).toBeNull();
    expect(whatsappUrl(null, 'x')).toBeNull();
  });
});

describe('smsUrl', () => {
  it('uses the separator each platform expects', () => {
    expect(smsUrl('05321234567', 'selam', 'ios')).toBe('sms:+905321234567&body=selam');
    expect(smsUrl('05321234567', 'selam', 'android')).toBe('sms:+905321234567?body=selam');
  });

  it('is null when there is no usable number', () => {
    expect(smsUrl('yok', 'x', 'ios')).toBeNull();
  });
});

describe('inviteLinkList', () => {
  it('pairs every guest with their own link', () => {
    const list = inviteLinkList(
      [{ fullName: 'Ayşe', guestToken: 't1' }, { fullName: 'Ali', guestToken: 't2' }],
      ORIGIN,
    );

    expect(list).toBe('Ayşe: https://davetim.app/rsvp/t1\nAli: https://davetim.app/rsvp/t2');
  });

  it('is empty for an empty list rather than a stray newline', () => {
    expect(inviteLinkList([], ORIGIN)).toBe('');
  });
});
