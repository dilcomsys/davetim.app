import type { Invitation } from '@/domain/models';
import { parseCalendarDate } from '@/lib/format';

/*
 * Event reminders are scheduled on the device, not pushed from the server.
 *
 * The date is already on the phone, the reminder needs no server state, and a
 * local notification fires with no network and no push token — so this half of
 * the feature works even for someone who declined push permission for
 * everything else. It also keeps the event calendar of every user off the
 * server's scheduling path.
 *
 * Two reminders per event: the evening before, when there is still time to act
 * on it, and the morning of. Both are computed in the device's own timezone,
 * because "the day before the wedding" is a local calendar idea.
 */

export type PlannedReminder = {
  id: string;
  invitationId: string;
  title: string;
  body: string;
  /** Epoch ms when the notification should fire. */
  fireAt: number;
};

const DAY_BEFORE_HOUR = 18;
const EVENT_DAY_HOUR = 9;

function at(date: Date, hour: number, dayOffset = 0) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, hour, 0, 0, 0);
  return result.getTime();
}

/**
 * Only published invitations produce reminders: a draft is not an event anyone
 * has been invited to yet, and reminding someone about it is noise.
 */
export function planReminders(invitations: Invitation[], now: number): PlannedReminder[] {
  const planned: PlannedReminder[] = [];

  for (const invitation of invitations) {
    if (invitation.status !== 'published' || !invitation.eventDate) continue;

    const eventDate = parseCalendarDate(invitation.eventDate);
    if (Number.isNaN(eventDate.getTime())) continue;

    const dayBefore = at(eventDate, DAY_BEFORE_HOUR, -1);
    const eventDay = at(eventDate, EVENT_DAY_HOUR);

    // Anything already in the past is skipped rather than fired immediately,
    // which is what a naive scheduler does to every past event on first launch.
    if (dayBefore > now) {
      planned.push({
        body: `${invitation.title} yarın. Son hazırlıklara göz at.`,
        fireAt: dayBefore,
        id: `event-before-${invitation.id}`,
        invitationId: invitation.id,
        title: 'Etkinlik yarın',
      });
    }

    if (eventDay > now) {
      planned.push({
        body: `${invitation.title} bugün. ${invitation.rsvpCount} yanıt aldın.`,
        fireAt: eventDay,
        id: `event-day-${invitation.id}`,
        invitationId: invitation.id,
        title: 'Bugün büyük gün',
      });
    }
  }

  return planned.sort((left, right) => left.fireAt - right.fireAt);
}
