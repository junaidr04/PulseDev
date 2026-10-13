export interface InstantNotificationPayload {
  _id?: string;
  title: string;
  message: string;
  type: 'auth' | 'task' | 'project' | 'system';
  actorName: string;
  actorAvatar: string;
  createdAt?: string;
}

export function emitInstantNotification(payload: InstantNotificationPayload) {
  if (typeof window === 'undefined') return;
  const fullNotif = {
    _id: payload._id || `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    read: false,
    actorName: payload.actorName,
    actorAvatar:
      payload.actorAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent('pulsedev:instant-notification', { detail: fullNotif })
  );
}

export function triggerNotificationRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('pulsedev:refresh-notifications'));
}
