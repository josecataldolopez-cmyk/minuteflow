import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../storageService';
import * as supabaseClientModule from '../supabaseClient';
import { MeetingMinute } from '../../types';

describe('storageService local persistence and safety', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, val: string) => { store[key] = val; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      },
      configurable: true,
    });
  });

  it('recovers safely from corrupted JSON in localStorage without throwing', async () => {
    vi.spyOn(supabaseClientModule, 'isSupabaseConfigured').mockReturnValue(false);
    store['minuteflow_minutes'] = '{invalid-json';
    const minutes = await storageService.getMinutes('org-redq');
    expect(Array.isArray(minutes)).toBe(true);
    expect(minutes.length).toBeGreaterThan(0);
  });

  it('saves and filters minutes locally per organization', async () => {
    vi.spyOn(supabaseClientModule, 'isSupabaseConfigured').mockReturnValue(false);
    const sample: MeetingMinute[] = [
      {
        id: 'm1',
        title: 'Acta Org A',
        directory: 'General',
        date: '2026-11-24',
        formattedDate: '24 nov 2026',
        time: '10:00',
        status: 'Aprobada',
        objectives: '',
        pointsTreated: '',
        keyDecisions: [],
        actionItems: [],
        attendees: [],
        organizationId: 'org-a',
      },
      {
        id: 'm2',
        title: 'Acta Org B',
        directory: 'General',
        date: '2026-11-24',
        formattedDate: '24 nov 2026',
        time: '11:00',
        status: 'Borrador',
        objectives: '',
        pointsTreated: '',
        keyDecisions: [],
        actionItems: [],
        attendees: [],
        organizationId: 'org-b',
      },
    ];

    storageService.saveMinutesLocal(sample);
    const orgAMinutes = await storageService.getMinutes('org-a');
    expect(orgAMinutes).toHaveLength(1);
    expect(orgAMinutes[0].id).toBe('m1');
  });

  it('returns success when saving single minute without Supabase configured', async () => {
    vi.spyOn(supabaseClientModule, 'isSupabaseConfigured').mockReturnValue(false);
    const res = await storageService.saveSingleMinute({
      id: 'm-test',
      title: 'Test',
      directory: 'General',
      date: '2026-11-24',
      formattedDate: '24 nov 2026',
      time: '10:00',
      status: 'Borrador',
      objectives: '',
      pointsTreated: '',
      keyDecisions: [],
      actionItems: [],
      attendees: [],
    });
    expect(res.success).toBe(true);
  });

  it('surfaces Supabase RLS or DB errors instead of failing silently (FUN-01)', async () => {
    vi.spyOn(supabaseClientModule, 'isSupabaseConfigured').mockReturnValue(true);
    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue({
      from: () => ({
        upsert: async () => ({ error: { message: 'new row violates row-level security policy' } }),
      }),
    } as any);

    const res = await storageService.saveSingleMinute({
      id: 'm-rls',
      title: 'Test RLS',
      directory: 'General',
      date: '2026-11-24',
      formattedDate: '24 nov 2026',
      time: '10:00',
      status: 'Borrador',
      objectives: '',
      pointsTreated: '',
      keyDecisions: [],
      actionItems: [],
      attendees: [],
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('row-level security');
  });
});
