import { MeetingMinute } from '../types';

/**
 * Servicio de sincronización y generación de eventos para Google Calendar e iCalendar (.ics).
 */

/**
 * Convierte fecha (YYYY-MM-DD) y hora (HH:mm) al formato YYYYMMDDTHHmm00 para Google Calendar
 */
function formatToCalendarDateTime(dateStr: string, timeStr: string = '10:00', addHours: number = 0): string {
  const [year, month, day] = dateStr.split('-');
  const [hoursStr, minutesStr] = (timeStr || '10:00').split(':');

  let hours = parseInt(hoursStr, 10) + addHours;
  const minutes = minutesStr || '00';

  if (isNaN(hours)) hours = 10 + addHours;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${year}${month}${day}T${pad(hours)}${minutes}00`;
}

/**
 * Genera la URL oficial de Google Calendar Web Intent para agendar la reunión con 1 clic
 */
export function generateGoogleCalendarUrl(minute: MeetingMinute, organizationName?: string): string {
  const dateToUse = minute.nextSessionDate || minute.date || new Date().toISOString().split('T')[0];
  const timeToUse = minute.time || '10:00';

  const startFormatted = formatToCalendarDateTime(dateToUse, timeToUse, 0);
  const endFormatted = formatToCalendarDateTime(dateToUse, timeToUse, 1);

  const org = organizationName || 'PactaCloud';
  const eventTitle = `Próxima Sesión: ${minute.title} (${org})`;

  // Resumen de acuerdos y objetivos para la descripción
  const decisionsSummary = minute.keyDecisions && minute.keyDecisions.length > 0
    ? `\n\nAcuerdos y Puntos Clave:\n${minute.keyDecisions.map((d) => `• ${d}`).join('\n')}`
    : '';

  const details = `Convocatoria oficial gestionada en PactaCloud Suite (${org}).\n\nCarpeta: ${minute.directory}\nActa de referencia: ${minute.title}${decisionsSummary}\n\nAcceso a la plataforma: https://pactacloud.vercel.app`;

  // Emails de los asistentes para invitarlos automáticamente
  const guestEmails = (minute.attendees || [])
    .map((a) => a.email?.trim())
    .filter((email): email is string => Boolean(email && email.includes('@')))
    .join(',');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${startFormatted}/${endFormatted}`,
    details: details
  });

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
  const dateToUse = minute.nextSessionDate || minute.date || new Date().toISOString().split('T')[0];
  const timeToUse = minute.time || '10:00';

  const start = formatToCalendarDateTime(dateToUse, timeToUse, 0);
  const end = formatToCalendarDateTime(dateToUse, timeToUse, 1);
  const org = organizationName || 'PactaCloud';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PactaCloud Suite//Actas y Compromisos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:pactacloud-${minute.id}-${Date.now()}@pactacloud.vercel.app`,
    `DTSTAMP:${start}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Próxima Sesión: ${minute.title} (${org})`,
    `DESCRIPTION:Acta gestionada en PactaCloud Suite - Carpeta ${minute.directory}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `reunion-${minute.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
