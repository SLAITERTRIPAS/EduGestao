import { AcademicEvent, UserNotification } from '../types';

const NOTIF_STORAGE_KEY = 'eduGestaoNotifications';
const EVENT_STORAGE_KEY = 'eduGestaoAcademicEvents';

export function getStoredNotifications(): UserNotification[] {
  try {
    const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error reading notifications:', e);
    return [];
  }
}

export function saveNotifications(notifications: UserNotification[]): void {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    // Dispatch custom event for real-time update in same window
    window.dispatchEvent(new Event('eduGestaoNotificationsUpdated'));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

export function getStoredEvents(): AcademicEvent[] {
  try {
    const saved = localStorage.getItem(EVENT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error reading events:', e);
    return [];
  }
}

export function saveEvents(events: AcademicEvent[]): void {
  try {
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new Event('eduGestaoEventsUpdated'));
  } catch (e) {
    console.error('Error saving events:', e);
  }
}

export function createNotificationForEvent(
  event: AcademicEvent,
  senderName: string,
  senderRole: string,
  recipients: { id: string; name: string; role: string; email?: string }[]
): UserNotification[] {
  const currentNotifs = getStoredNotifications();
  const nowStr = new Date().toLocaleString('pt-PT');

  const newNotifs: UserNotification[] = recipients.map((r) => ({
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: `Você tem uma mensagem nova: ${event.title}`,
    message: event.message || event.description || 'Novo evento agendado no calendário.',
    eventId: event.id,
    eventDetails: event,
    senderName,
    senderRole,
    recipientId: r.id,
    recipientName: r.name,
    isRead: false,
    createdAt: nowStr,
  }));

  const updated = [...newNotifs, ...currentNotifs];
  saveNotifications(updated);
  return updated;
}
