import { MeetingMinute, ActionItem, Attendee, DirectoryItem, Organization, UserProfile } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_ORGANIZATIONS, INITIAL_MINUTES, INITIAL_ACTION_ITEMS, INITIAL_ATTENDEES, INITIAL_DIRECTORIES, INITIAL_USER_PROFILE } from '../data/mockData';

/**
 * Servicio unificado de persistencia para PactaCloud.
 * Sincroniza con Supabase PostgreSQL si está configurado, con fallback transparente a LocalStorage.
 */
export const storageService = {
  // ================= ORGANIZACIONES =================
  async getOrganizations(): Promise<Organization[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('organizations').select('*');
          if (!error && data && data.length > 0) {
            return data.map((o: any) => ({
              id: o.id,
              name: o.name,
              code: o.code,
              taxId: o.tax_id,
              domain: o.domain,
              driveAccount: o.drive_account,
              driveWebhookUrl: o.drive_webhook_url,
              logoUrl: o.logo_url,
              plan: o.plan,
              createdAt: o.created_at,
              primaryColor: o.primary_color || '#4f46e5',
              secondaryColor: o.secondary_color,
              slogan: o.slogan,
              headerText: o.header_text
            }));
          }
        } catch (err) {
          console.warn('Fallback a localStorage para organizaciones:', err);
        }
      }
    }

    const saved = localStorage.getItem('minuteflow_organizations');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  },

  async saveOrganizations(orgs: Organization[]): Promise<void> {
    localStorage.setItem('minuteflow_organizations', JSON.stringify(orgs));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const rows = orgs.map((o) => ({
            id: o.id.startsWith('org-') ? undefined : o.id,
            name: o.name,
            code: o.code,
            tax_id: o.taxId,
            domain: o.domain,
            drive_account: o.driveAccount,
            drive_webhook_url: o.driveWebhookUrl,
            logo_url: o.logoUrl,
            plan: o.plan,
            primary_color: o.primaryColor,
            secondary_color: o.secondaryColor,
            slogan: o.slogan,
            header_text: o.headerText
          })).filter(r => r.id);

          if (rows.length > 0) {
            await supabase.from('organizations').upsert(rows);
          }
        } catch (err) {
          console.warn('No se pudo sincronizar organizaciones en Supabase:', err);
        }
      }
    }
  },

  // ================= ACTAS (MINUTES) =================
  async getMinutes(orgId: string): Promise<MeetingMinute[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('minutes')
            .select('*')
            .eq('organization_id', orgId);

          if (!error && data) {
            return data.map((m: any) => ({
              id: m.id,
              title: m.title,
              directory: m.directory_name || 'Actas Generales',
              date: m.date,
              time: m.time,
              formattedDate: m.formatted_date,
              status: m.status,
              objectives: m.objectives,
              pointsTreated: m.points_treated,
              nextSessionDate: m.next_session_date,
              organizationId: m.organization_id,
              recordingUrl: m.recording_url,
              actionItems: [],
              attendees: []
            }));
          }
        } catch (err) {
          console.warn('Fallback a localStorage para actas:', err);
        }
      }
    }

    const saved = localStorage.getItem('minuteflow_minutes');
    const all: MeetingMinute[] = saved ? JSON.parse(saved) : INITIAL_MINUTES;
    return all.filter((m) => (m.organizationId || 'org-redq') === orgId);
  },

  async saveMinutes(minutes: MeetingMinute[]): Promise<void> {
    localStorage.setItem('minuteflow_minutes', JSON.stringify(minutes));
  },

  // ================= COMPROMISOS / TAREAS =================
  async getActionItems(orgId: string): Promise<ActionItem[]> {
    const saved = localStorage.getItem('minuteflow_action_items');
    const all: ActionItem[] = saved ? JSON.parse(saved) : INITIAL_ACTION_ITEMS;
    return all.filter((a) => (a.organizationId || 'org-redq') === orgId);
  },

  async saveActionItems(items: ActionItem[]): Promise<void> {
    localStorage.setItem('minuteflow_action_items', JSON.stringify(items));
  },

  // ================= CONTACTOS Y ASISTENTES =================
  async getAttendees(orgId: string): Promise<Attendee[]> {
    const saved = localStorage.getItem('minuteflow_attendees');
    const all: Attendee[] = saved ? JSON.parse(saved) : INITIAL_ATTENDEES;
    return all.filter((a) => (a.organizationId || 'org-redq') === orgId);
  },

  async saveAttendees(attendees: Attendee[]): Promise<void> {
    localStorage.setItem('minuteflow_attendees', JSON.stringify(attendees));
  },

  // ================= CARPETAS / DIRECTORIOS =================
  async getDirectories(orgId: string): Promise<DirectoryItem[]> {
    const saved = localStorage.getItem('minuteflow_directories');
    const all: DirectoryItem[] = saved ? JSON.parse(saved) : INITIAL_DIRECTORIES;
    return all.filter((d) => (d.organizationId || 'org-redq') === orgId);
  },

  async saveDirectories(directories: DirectoryItem[]): Promise<void> {
    localStorage.setItem('minuteflow_directories', JSON.stringify(directories));
  },

  // ================= PERFIL DE USUARIO =================
  getUserProfile(): UserProfile {
    const saved = localStorage.getItem('minuteflow_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem('minuteflow_user_profile', JSON.stringify(profile));
  }
};
