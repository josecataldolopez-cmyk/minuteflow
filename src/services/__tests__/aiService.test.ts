import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeAndEnhanceMinute } from '../aiService';

describe('aiService offline heuristic fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
  });

  it('extracts action items and bullet points when backend is unreachable', async () => {
    const rawNotes = [
      'Revisión de presupuesto Q4',
      'Compromiso: Enviar informe urgente de gastos a rectoría',
      'Se revisaron los avances del semestre'
    ].join('\n');

    const result = await analyzeAndEnhanceMinute(rawNotes, 'Reunión Directorio');

    expect(result.title).toBe('Reunión Directorio');
    expect(result.pointsTreated).toContain('Revisión de presupuesto Q4');
    expect(result.actionItems).toBeDefined();
    expect(result.actionItems!.length).toBeGreaterThan(0);
    expect(result.actionItems![0].priority).toBe('High');
    expect(result.actionItems![0].text).toContain('Enviar informe urgente de gastos');
  });

  it('returns structured default response on empty input', async () => {
    const result = await analyzeAndEnhanceMinute('   ', 'Acta Vacía');
    expect(result.title).toBe('Acta Vacía');
    expect(result.objectives).toBeTruthy();
    expect(result.actionItems?.length).toBeGreaterThan(0);
  });
});
