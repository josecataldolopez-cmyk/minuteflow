import { describe, it, expect } from 'vitest';
import { formatToCalendarDateTime, generateGoogleCalendarUrl } from '../calendarService';
import { MeetingMinute } from '../../types';

describe('calendarService', () => {
  it('formats valid YYYY-MM-DD and HH:mm into Google Calendar local datetime', () => {
    expect(formatToCalendarDateTime('2026-11-24', '14:30', 0)).toBe('20261124T143000');
    expect(formatToCalendarDateTime('2026-11-24', '14:30', 1)).toBe('20261124T153000');
  });

  it('handles missing or malformed date gracefully without NaN/undefined', () => {
    const formatted = formatToCalendarDateTime('', '', 0);
    expect(formatted).toMatch(/^\d{8}T\d{6}$/);
  });

  it('generates Google Calendar Web Intent URL with org name, decisions and valid guest emails', () => {
    const mockMinute: MeetingMinute = {
      id: 'min-1',
      title: 'Consejo Académico',
      directory: 'Dirección',
      date: '2026-11-24',
      formattedDate: '24 nov 2026',
      time: '09:00',
      status: 'Aprobada',
      objectives: 'Revisar metas anuales',
      pointsTreated: '• Aprobar presupuesto',
      keyDecisions: ['Aprobar presupuesto 2027'],
      actionItems: [],
      attendees: [
        { id: '1', name: 'Ana', email: 'ana@colegio.cl', role: 'Directora', avatarUrl: '' },
        { id: '2', name: 'Sin Email', email: 'invalido', role: 'Invitado', avatarUrl: '' },
        { id: '3', name: 'Luis', email: 'luis@colegio.cl', role: 'UTP', avatarUrl: '' },
      ],
      nextSessionDate: '2026-12-01',
      syncCalendar: true,
    };

    const url = generateGoogleCalendarUrl(mockMinute, 'Colegio San Martín');
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://calendar.google.com');
    expect(parsed.searchParams.get('action')).toBe('TEMPLATE');
    expect(parsed.searchParams.get('text')).toBe('Próxima Sesión: Consejo Académico (Colegio San Martín)');
    expect(parsed.searchParams.get('dates')).toBe('20261201T090000/20261201T100000');
    expect(parsed.searchParams.get('add')).toBe('ana@colegio.cl,luis@colegio.cl');
    expect(parsed.searchParams.get('details')).toContain('Aprobar presupuesto 2027');
  });
});
