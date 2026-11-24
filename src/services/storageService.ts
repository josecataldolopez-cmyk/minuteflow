import { MeetingMinute, ActionItem, Attendee, DirectoryItem, Organization, UserProfile } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_ORGANIZATIONS, INITIAL_MINUTES, INITIAL_ACTION_ITEMS, INITIAL_ATTENDEES, INITIAL_DIRECTORIES, INITIAL_USER_PROFILE } from '../data/mockData';

/**
 * Función defensiva para parsear JSON de localStorage con fallback seguro
 */
function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('PactaCloud: Error parseando JSON de localStorage, usando fallback:', err);
    return fallback;
  }
}

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
              headerText: o.header_text,
              address: o.address
            }));
          }
        } catch (err) {
          console.warn('Fallback a localStorage para organizaciones:', err);
        }
      }
    }

    const saved = localStorage.getItem('minuteflow_organizations');
    return safeJsonParse<Organization[]>(saved, INITIAL_ORGANIZATIONS);
  },

  async saveOrganizations(orgs: Organization[]): Promise<void> {
    localStorage.setItem('minuteflow_organizations', JSON.stringify(orgs));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const rows = orgs.map((o) => ({
            id: o.id,
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
            header_text: o.headerText,
            address: o.address
          }));

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

          if (!error && data && data.length > 0) {
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
              keyDecisions: m.key_decisions || [],
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
    const all: MeetingMinute[] = safeJsonParse<MeetingMinute[]>(saved, INITIAL_MINUTES);
    return all.filter((m) => (m.organizationId || 'org-redq') === orgId);
  },

  async saveMinutes(minutes: MeetingMinute[]): Promise<void> {
    localStorage.setItem('minuteflow_minutes', JSON.stringify(minutes));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const rows = minutes.map((m) => ({
            id: m.id,
            organization_id: m.organizationId || 'org-redq',
            title: m.title,
            directory_name: m.directory,
            date: m.date,
            time: m.time || '12:00',
            formatted_date: m.formattedDate,
            status: m.status,
            objectives: m.objectives,
            points_treated: m.pointsTreated,
            next_session_date: m.nextSessionDate || null,
            recording_url: m.recordingUrl || null
          }));

          if (rows.length > 0) {
            await supabase.from('minutes').upsert(rows);
          }
        } catch (err) {
          console.warn('No se pudo sincronizar actas en Supabase:', err);
        }
      }
    }
  },

  // ================= COMPROMISOS / TAREAS =================
  async getActionItems(orgId: string): Promise<ActionItem[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('action_items')
            .select('*')
            .eq('organization_id', orgId);

          if (!error && data && data.length > 0) {
            return data.map((a: any) => ({
              id: a.id,
              text: a.title,
              completed: a.status === 'COMPLETED',
              priority: (a.priority ? a.priority.charAt(0).toUpperCase() + a.priority.slice(1).toLowerCase() : 'Medium') as any,
              dueDate: a.due_date,
              assignedTo: a.assignee ? { id: `att-${a.id}`, name: a.assignee, email: '', avatarUrl: a.assignee_avatar || '' } : undefined,
              sourceMinuteId: a.minute_id,
              organizationId: a.organization_id
            }));
          }
        } catch (err) {
          console.warn('Fallback a localStorage para compromisos:', err);
        }
      }
    }

    const saved = localStorage.getItem('minuteflow_action_items');
    const all: ActionItem[] = safeJsonParse<ActionItem[]>(saved, INITIAL_ACTION_ITEMS);
    return all.filter((a) => (a.organizationId || 'org-redq') === orgId);
  },

  async saveActionItems(items: ActionItem[]): Promise<void> {
    localStorage.setItem('minuteflow_action_items', JSON.stringify(items));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const rows = items.map((a) => ({
            id: a.id,
            minute_id: a.sourceMinuteId || null,
            organization_id: a.organizationId || 'org-redq',
            title: a.text,
            assignee: a.assignedTo?.name || 'Sin asignar',
            assignee_avatar: a.assignedTo?.avatarUrl || null,
            due_date: a.dueDate,
            status: a.completed ? 'COMPLETED' : 'PENDING',
            priority: a.priority ? a.priority.toUpperCase() : 'MEDIUM'
          }));

          if (rows.length > 0) {
            await supabase.from('action_items').upsert(rows);
          }
        } catch (err) {
          console.warn('No se pudo sincronizar compromisos en Supabase:', err);
        }
      }
    }
  },

  // ================= CONTACTOS Y ASISTENTES =================
  async getAttendees(orgId: string): Promise<Attendee[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('attendees')
            .select('*')
            .eq('organization_id', orgId);

          if (!error && data && data.length > 0) {
            return data.map((att: any) => ({
              id: att.id,
              name: att.name,
              email: att.email || '',
              role: att.role || 'Miembro',
              avatarUrl: att.avatar_url || '',
              organizationId: att.organization_id
            }));
          }
        } catch (err) {
          console.warn('Fallback a localStorage para asistentes:', err);
        }
      }
    }

    const saved = localStorage.getItem('minuteflow_attendees');
    const all: Attendee[] = safeJsonParse<Attendee[]>(saved, INITIAL_ATTENDEES);
    return all.filter((a) => (a.organizationId || 'org-redq') === orgId);
  },

  async saveAttendees(attendees: Attendee[]): Promise<void> {
    localStorage.setItem('minuteflow_attendees', JSON.stringify(attendees));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const rows = attendees.map((att) => ({
            id: att.id,
            organization_id: att.organizationId || 'org-redq',
            name: att.name,
            email: att.email,
            role: att.role || 'Miembro',
            avatar_url: att.avatarUrl || null
          }));

          if (rows.length > 0) {
            await supabase.from('attendees').upsert(rows);
          }
        } catch (err) {
          console.warn('No se pudo sincronizar asistentes en Supabase:', err);
        }
      }
    }
  },

  // ================= CARPETAS / DIRECTORIOS =================
  async getDirectories(orgId: string): Promise<DirectoryItem[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('directories')
            .select('*')
            .eq('organization_id', orgId);

          if (!error && data && data.length > 0) {
            return data.map((d: any) => ({
              id: d.id,
              name: d.name,
              count: 0,
              icon: 'folder',
              organizationId: d.organization_id
            }));
          }
        } catch (err) {
          console.warn('Fallback a localStorage para directorios:', err);
        }
      }
    }

    const saved = localStorage.getItem('minuteflow_directories');
    const all: DirectoryItem[] = safeJsonParse<DirectoryItem[]>(saved, INITIAL_DIRECTORIES);
    return all.filter((d) => (d.organizationId || 'org-redq') === orgId);
  },

  async saveDirectories(directories: DirectoryItem[]): Promise<void> {
    localStorage.setItem('minuteflow_directories', JSON.stringify(directories));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const rows = directories.map((d) => ({
            id: d.id,
            organization_id: d.organizationId || 'org-redq',
            name: d.name,
            color: '#4f46e5'
          }));

          if (rows.length > 0) {
            await supabase.from('directories').upsert(rows);
          }
        } catch (err) {
          console.warn('No se pudo sincronizar directorios en Supabase:', err);
        }
      }
    }
  },

  // ================= PERFIL DE USUARIO =================
  getUserProfile(): UserProfile {
    const saved = localStorage.getItem('minuteflow_user_profile');
    return safeJsonParse<UserProfile>(saved, INITIAL_USER_PROFILE);
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem('minuteflow_user_profile', JSON.stringify(profile));
  },

  async getProfileFromSupabase(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        name: data.full_name || 'Usuario',
        email: data.email,
        role: data.role === 'admin' || data.role === 'superadmin' ? 'Administrador' : 'Secretario de Actas',
        systemRole: data.role,
        avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.full_name || data.email)}`,
        organizationId: data.organization_id
      };
    } catch {
      return null;
    }
  }
};
