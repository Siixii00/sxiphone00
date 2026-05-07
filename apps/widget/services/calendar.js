const EVENTS_KEY = 'sx_calendar_events';

export function getEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addEvent(event) {
  const events = getEvents();
  event.id = 'evt_' + Date.now();
  event.createdAt = new Date().toISOString();
  events.push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  return event;
}

export function updateEvent(eventId, updates) {
  const events = getEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    return events[index];
  }
  return null;
}

export function deleteEvent(eventId) {
  const events = getEvents();
  const filtered = events.filter(e => e.id !== eventId);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(filtered));
  return true;
}

export function getTodayEvents() {
  const events = getEvents();
  const today = new Date().toISOString().split('T')[0];
  return events
    .filter(e => e.date === today || e.startDate === today)
    .sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
}

export function getUpcomingEvents(days = 7) {
  const events = getEvents();
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return events
    .filter(e => {
      const eventDate = new Date(e.date || e.startDate);
      return eventDate >= now && eventDate <= future;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.startDate);
      const dateB = new Date(b.date || b.startDate);
      return dateA - dateB;
    });
}

export function getEventsByDate(date) {
  const events = getEvents();
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return events.filter(e => e.date === dateStr || e.startDate === dateStr);
}

export function getEventsByMonth(year, month) {
  const events = getEvents();
  return events.filter(e => {
    const eventDate = new Date(e.date || e.startDate);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
}

export function searchEvents(query) {
  const events = getEvents();
  const lowerQuery = query.toLowerCase();
  return events.filter(e => 
    (e.title && e.title.toLowerCase().includes(lowerQuery)) ||
    (e.description && e.description.toLowerCase().includes(lowerQuery)) ||
    (e.location && e.location.toLowerCase().includes(lowerQuery))
  );
}

export function createEvent(title, date, options = {}) {
  return addEvent({
    title,
    date,
    time: options.time || null,
    endDate: options.endDate || null,
    endTime: options.endTime || null,
    location: options.location || null,
    description: options.description || null,
    color: options.color || '#0A84FF',
    reminder: options.reminder || null,
    recurring: options.recurring || null
  });
}

export function getWeekEvents() {
  const events = getEvents();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  
  return events.filter(e => {
    const eventDate = new Date(e.date || e.startDate);
    return eventDate >= startOfWeek && eventDate < endOfWeek;
  });
}

export function getMonthEvents() {
  const now = new Date();
  return getEventsByMonth(now.getFullYear(), now.getMonth());
}

export function clearAllEvents() {
  localStorage.removeItem(EVENTS_KEY);
}

export function importEvents(eventsArray) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(eventsArray));
}

export function exportEvents() {
  return getEvents();
}
