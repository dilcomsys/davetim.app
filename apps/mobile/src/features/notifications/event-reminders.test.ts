import { describe, expect, it } from 'vitest';

import type { Invitation } from '@/domain/models';
import { planReminders } from '@/features/notifications/event-reminders';

function invitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 'inv-1',
    userId: 'user-1',
    templateId: null,
    title: 'Zeynep & Kerem',
    slug: 'zeynep-kerem',
    eventType: null,
    eventDate: '2026-09-12',
    eventTime: null,
    eventLocationName: null,
    eventLocationAddress: null,
    customDesign: {},
    content: {},
    settings: {},
    status: 'published',
    isPublic: true,
    viewCount: 0,
    rsvpCount: 12,
    imageUrl: null,
    publishedAt: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

const BEFORE_EVENT = new Date(2026, 8, 1).getTime();

describe('planReminders', () => {
  it('plans the evening before and the morning of, in local time', () => {
    const planned = planReminders([invitation()], BEFORE_EVENT);
    expect(planned).toHaveLength(2);

    const [dayBefore, eventDay] = planned.map((item) => new Date(item.fireAt));
    expect([dayBefore.getMonth(), dayBefore.getDate(), dayBefore.getHours()]).toEqual([8, 11, 18]);
    expect([eventDay.getMonth(), eventDay.getDate(), eventDay.getHours()]).toEqual([8, 12, 9]);
  });

  it('gives each reminder a stable id so rescheduling replaces rather than duplicates', () => {
    const first = planReminders([invitation()], BEFORE_EVENT);
    const second = planReminders([invitation()], BEFORE_EVENT);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(new Set(first.map((item) => item.id)).size).toBe(2);
  });

  // A naive scheduler fires every past event at once on first launch.
  it('skips reminders whose moment has passed', () => {
    const afterDayBefore = new Date(2026, 8, 11, 20).getTime();
    expect(planReminders([invitation()], afterDayBefore).map((item) => item.id))
      .toEqual(['event-day-inv-1']);

    const afterEvent = new Date(2026, 8, 13).getTime();
    expect(planReminders([invitation()], afterEvent)).toEqual([]);
  });

  it('ignores anything that is not a published, dated event', () => {
    expect(planReminders([invitation({ status: 'draft' })], BEFORE_EVENT)).toEqual([]);
    expect(planReminders([invitation({ status: 'archived' })], BEFORE_EVENT)).toEqual([]);
    expect(planReminders([invitation({ eventDate: null })], BEFORE_EVENT)).toEqual([]);
    expect(planReminders([invitation({ eventDate: 'yakında' })], BEFORE_EVENT)).toEqual([]);
  });

  it('orders reminders by when they fire', () => {
    const planned = planReminders([
      invitation({ eventDate: '2026-12-01', id: 'late' }),
      invitation({ eventDate: '2026-09-12', id: 'soon' }),
    ], BEFORE_EVENT);
    expect(planned.map((item) => item.fireAt)).toEqual([...planned.map((item) => item.fireAt)].sort((a, b) => a - b));
    expect(planned[0].invitationId).toBe('soon');
  });

  it('mentions the invitation by name so a stacked notification still reads', () => {
    const planned = planReminders([invitation({ title: 'Ayşe & Mehmet' })], BEFORE_EVENT);
    expect(planned[0].body).toContain('Ayşe & Mehmet');
  });
});
