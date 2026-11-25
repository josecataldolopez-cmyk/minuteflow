import { MeetingMinute } from '../types';

/**
 * Servicio de sincronización y generación de eventos para Google Calendar e iCalendar (.ics).
 */

/**
 * Convierte fecha (YYYY-MM-DD) y hora (HH:mm) al formato YYYYMMDDTHHmm00 para Google Calendar
 */
export function formatToCalendarDateTime(dateStr?: string, timeStr: string = '10:00', addHours: number = 0): string {
  let d = new Date();
  if (dateStr && dateStr.trim()) {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(day)) {
        d = new Date(y, m, day);
      }
    }
  }

  let hours = 10;
  let minutes = 0;
  if (timeStr && timeStr.includes(':')) {
    const [h, min] = timeStr.split(':');
    const parsedH = parseInt(h, 10);
    const parsedM = parseInt(min, 10);
    if (!isNaN(parsedH)) hours = parsedH;
    if (!isNaN(parsedM)) minutes = parsedM;
  }

  hours += addHours;
  d.setHours(hours, minutes, 0, 0);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());

  return `${yyyy}${mm}${dd}T${hh}${min}00`;
}

/**
 * Genera la URL oficial de Google Calendar Web Intent para agendar la reunión con 1 clic
 */
export function generateGoogleCalendarUrl(minute: MeetingMinute, organizationName?: string): string {
  const dateToUse = minute.nextSessionDate || minute.date;
  const timeToUse = minute.time || '10:00';

  const startFormatted = formatToCalendarDateTime(dateToUse, timeToUse, 0);
  const endFormatted = formatToCalendarDateTime(dateToUse, timeToUse, 1);

  const org = organizationName || 'PactaCloud';
  const eventTitle = `Próxima Sesión: ${minute.title} (${org})`;

  // Resumen de acuerdos y objetivos para la descripción
  const decisionsSummary = minute.keyDecisions && minute.keyDecisions.length > 0
    ? `\n\nAcuerdos y Compromisos:\n${minute.keyDecisions.map((d) => `• ${d}`).join('\n')}`
    : '';

  const details = `Convocatoria oficial gestionada en PactaCloud Suite (${org}).\n\nCarpeta: ${minute.directory}\nActa de referencia: ${minute.title}${decisionsSummary}\n\nAcceso a la plataforma: https://pactacloud.vercel.app`;

  // Emails de los asistentes para invitarlos automáticamente
  const guestEmails = (minute.attendees || [])
    .map((a) => a.email?.trim())
    .filter((email): email is string => Boolean(email && email.includes('@')))
    .join(',');

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', eventTitle);
  params.set('dates', `${startFormatted}/${endFormatted}`);
  params.set('details', details);

  if (guestEmails) {
    params.set('add', guestEmails);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Abre Google Calendar en una nueva pestaña con los datos precargados
 */
export function openGoogleCalendarEvent(minute: MeetingMinute, organizationName?: string): Window | null {
  const url = generateGoogleCalendarUrl(minute, organizationName);
  return window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Genera y descarga un archivo estándar iCalendar (.ics) compatible con Outlook, Apple y Google
 */
export function downloadIcsFile(minute: MeetingMinute, organizationName?: string): void {
  const dateToUse = minute.nextSessionDate || minute.date;
  const timeToUse = minute.time || '10:00';

  const start = formatToCalendarDateTime(dateToUse, timeToUse, 0);
  const end = formatToCalendarDateTime(dateToUse, timeToUse, 1);
  const org = organizationName || 'PactaCloud';

  const escapeIcsText = (value: string): string => value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
  const escapeIcsEmail = (email: string): string => email.replace(/[\r\n:;,]/g, '');

  const guestEmails = (minute.attendees || [])
    .map((a) => a.email?.trim())
    .filter((email): email is string => Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)));

  const attendeeLines = guestEmails.map((email) => `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${escapeIcsEmail(email)}`).join('\r\n');

  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PactaCloud Suite//Actas y Compromisos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:pactacloud-${minute.id}-${Date.now()}@pactacloud.vercel.app`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(`Próxima Sesión: ${minute.title} (${org})`)}`,
    `DESCRIPTION:${escapeIcsText(`Acta gestionada en PactaCloud Suite - Carpeta ${minute.directory}`)}`,
    'STATUS:CONFIRMED'
  ];

  if (attendeeLines) {
    icsLines.push(attendeeLines);
  }

  icsLines.push('END:VEVENT');
  icsLines.push('END:VCALENDAR');

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reunion-${minute.nextSessionDate || 'proxima-sesion'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
