import { describe, it, expect } from 'vitest';
import { generateMinuteHTML } from '../googleDriveOAuthService';
import { MeetingMinute, Organization } from '../../types';

describe('pdfExport / generateMinuteHTML', () => {
  it('renders official header, RUT, signature block and escapes HTML injection', () => {
    const minute: MeetingMinute = {
      id: 'min-pdf-1',
      title: 'Acta <script>alert(1)</script> Directorio',
      directory: 'Dirección',
      date: '2026-11-25',
      formattedDate: '25 nov 2026',
      time: '10:00',
      status: 'Aprobada',
      objectives: 'Aprobar plan anual',
      pointsTreated: '• Punto 1',
      keyDecisions: ['Acuerdo 1'],
      actionItems: [
        { id: 'a1', text: 'Enviar presupuesto', completed: false, priority: 'High', dueDate: '2026-12-01' }
      ],
      attendees: [
        { id: 'att1', name: 'María', email: 'maria@colegio.cl', role: 'Rectora', avatarUrl: '' }
      ]
    };

    const org: Organization = {
      id: 'org-1',
      name: 'Colegio Los Robles',
      code: 'CLR',
      taxId: '76.123.456-7',
      address: 'Av. Principal 123',
      domain: 'colegio.cl',
      driveAccount: 'actas@colegio.cl',
      plan: 'ENTERPRISE',
      primaryColor: '#4f46e5'
    };

    const html = generateMinuteHTML(minute, org);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Colegio Los Robles');
    expect(html).toContain('76.123.456-7');
    expect(html).toContain('Dirección / Presidencia');
    expect(html).toContain('Secretaría de Actas');
  });
});
