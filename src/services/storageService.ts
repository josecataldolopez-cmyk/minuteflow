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
export interface StorageMutationResult {
  success: boolean;
  error?: string;
}

async function execSupabaseWrite(
  label: string,
  operation: () => PromiseLike<{ error: { message: string } | null }>
): Promise<StorageMutationResult> {
  try {
    const { error } = await operation();
    if (error) {
      console.error(`[Supabase ${label}]`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de conexión con Supabase';
    console.error(`[Supabase ${label}]`, msg);
    return { success: false, error: msg };
  }
}

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

  async saveOrganizations(orgs: Organization[]): Promise<StorageMutationResult> {
    localStorage.setItem('minuteflow_organizations', JSON.stringify(orgs));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
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
          return execSupabaseWrite('saveOrganizations', () =>
            supabase.from('organizations').upsert(rows)
          );
        }
      }
    }
    return { success: true };
  },

  // ================= ACTAS (MINUTES) =================
  async getMinutes(orgId: string): Promise<MeetingMinute[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const [minRes, actRes] = await Promise.all([
              supabase.from('minutes').select('*').eq('organization_id', orgId).order('date', { ascending: false }),
              supabase.from('action_items').select('*').eq('organization_id', orgId)
            ]);

            if (!minRes.error && minRes.data) {
              const rawActions = actRes.data || [];
              return minRes.data.map((m: any) => {
                const minuteActions: ActionItem[] = rawActions
                  .filter((a: any) => a.minute_id === m.id)
                  .map((a: any) => ({
                    id: a.id,
                    text: a.title,
                    completed: a.status === 'COMPLETED',
                    priority: (a.priority ? a.priority.charAt(0).toUpperCase() + a.priority.slice(1).toLowerCase() : 'Medium') as any,
                    dueDate: a.due_date,
                    assignedTo: a.assignee ? { id: `att-${a.id}`, name: a.assignee, email: '', avatarUrl: a.assignee_avatar || '' } : undefined,
                    sourceMinuteId: a.minute_id,
                    organizationId: a.organization_id
                  }));

                return {
                  id: m.id,
                  title: m.title,
                  directory: m.directory_name || 'Actas Generales',
                  date: m.date,
                  time: m.time,
                  formattedDate: m.formatted_date,
                  status: m.status,
                  objectives: m.objectives,
                  pointsTreated: m.points_treated,
                  keyDecisions: Array.isArray(m.key_decisions) ? m.key_decisions : [],
                  nextSessionDate: m.next_session_date,
                  organizationId: m.organization_id,
                  recordingUrl: m.recording_url,
                  actionItems: minuteActions,
                  attendees: Array.isArray(m.attendees_list) ? m.attendees_list : []
                };
              });
            }
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

  saveMinutesLocal(minutes: MeetingMinute[]): void {
    localStorage.setItem('minuteflow_minutes', JSON.stringify(minutes));
  },

  async saveSingleMinute(minute: MeetingMinute, actionItems?: ActionItem[]): Promise<StorageMutationResult> {
    if (!isSupabaseConfigured()) return { success: true };
    const supabase = getSupabase();
    if (!supabase) return { success: true };

    const row = {
      id: minute.id,
      organization_id: minute.organizationId || 'org-redq',
      title: minute.title,
      directory_name: minute.directory,
      date: minute.date,
      time: minute.time || '12:00',
      formatted_date: minute.formattedDate,
      status: minute.status,
      objectives: minute.objectives,
      points_treated: minute.pointsTreated,
      key_decisions: minute.keyDecisions || [],
      attendees_list: minute.attendees || [],
      next_session_date: minute.nextSessionDate || null,
      recording_url: minute.recordingUrl || null,
      updated_at: new Date().toISOString()
    };

    const minResult = await execSupabaseWrite('saveSingleMinute', () =>
      supabase.from('minutes').upsert(row)
    );
    if (!minResult.success) return minResult;

    if (actionItems) {
      const actionRows = actionItems.map((a) => ({
        id: a.id,
        minute_id: minute.id,
        organization_id: a.organizationId || minute.organizationId || 'org-redq',
        title: a.text,
        assignee: a.assignedTo?.name || 'Sin asignar',
        assignee_avatar: a.assignedTo?.avatarUrl || null,
        due_date: a.dueDate,
        status: a.completed ? 'COMPLETED' : 'PENDING',
        priority: a.priority ? a.priority.toUpperCase() : 'MEDIUM'
      }));

      // Eliminar tareas removidas en el editor para esta acta
      const currentIds = actionItems.map((a) => a.id);
      const { data: existingRows } = await supabase
        .from('action_items')
        .select('id')
        .eq('minute_id', minute.id);

      if (existingRows && existingRows.length > 0) {
        const idsToDelete = existingRows
          .map((r: { id: string }) => r.id)
          .filter((id: string) => !currentIds.includes(id));

        if (idsToDelete.length > 0) {
          await execSupabaseWrite('deleteRemovedActionItems', () =>
            supabase.from('action_items').delete().in('id', idsToDelete)
          );
        }
      }

      if (actionRows.length > 0) {
        return execSupabaseWrite('upsertMinuteActionItems', () =>
          supabase.from('action_items').upsert(actionRows)
        );
      }
    }

    return { success: true };
  },

  async saveMinutes(minutes: MeetingMinute[]): Promise<StorageMutationResult> {
    localStorage.setItem('minuteflow_minutes', JSON.stringify(minutes));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
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
          key_decisions: m.keyDecisions || [],
          attendees_list: m.attendees || [],
          next_session_date: m.nextSessionDate || null,
          recording_url: m.recordingUrl || null,
          updated_at: new Date().toISOString()
        }));

        if (rows.length > 0) {
          return execSupabaseWrite('saveMinutes', () =>
            supabase.from('minutes').upsert(rows)
          );
        }
      }
    }
    return { success: true };
  },

  async deleteMinute(minuteId: string): Promise<StorageMutationResult> {
    const saved = localStorage.getItem('minuteflow_minutes');
    if (saved) {
      const all = safeJsonParse<MeetingMinute[]>(saved, []);
      localStorage.setItem('minuteflow_minutes', JSON.stringify(all.filter((m) => m.id !== minuteId)));
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        await execSupabaseWrite('deleteMinuteActions', () =>
          supabase.from('action_items').delete().eq('minute_id', minuteId)
        );
        return execSupabaseWrite('deleteMinute', () =>
          supabase.from('minutes').delete().eq('id', minuteId)
        );
      }
    }
    return { success: true };
  },

  // ================= COMPROMISOS / TAREAS =================
  async getActionItems(orgId: string): Promise<ActionItem[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data, error } = await supabase
              .from('action_items')
              .select('*')
              .eq('organization_id', orgId);

            if (!error && data) {
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

  saveActionItemsLocal(items: ActionItem[]): void {
    localStorage.setItem('minuteflow_action_items', JSON.stringify(items));
  },

  async saveSingleActionItem(item: ActionItem): Promise<StorageMutationResult> {
    if (!isSupabaseConfigured()) return { success: true };
    const supabase = getSupabase();
    if (!supabase) return { success: true };

    const row = {
      id: item.id,
      minute_id: item.sourceMinuteId || null,
      organization_id: item.organizationId || 'org-redq',
      title: item.text,
      assignee: item.assignedTo?.name || 'Sin asignar',
      assignee_avatar: item.assignedTo?.avatarUrl || null,
      due_date: item.dueDate,
      status: item.completed ? 'COMPLETED' : 'PENDING',
      priority: item.priority ? item.priority.toUpperCase() : 'MEDIUM'
    };

    return execSupabaseWrite('saveSingleActionItem', () =>
      supabase.from('action_items').upsert(row)
    );
  },

  async saveActionItems(items: ActionItem[]): Promise<StorageMutationResult> {
    localStorage.setItem('minuteflow_action_items', JSON.stringify(items));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
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
          return execSupabaseWrite('saveActionItems', () =>
            supabase.from('action_items').upsert(rows)
          );
        }
      }
    }
    return { success: true };
  },

  // ================= CONTACTOS Y ASISTENTES =================
  async getAttendees(orgId: string): Promise<Attendee[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data, error } = await supabase
              .from('attendees')
              .select('*')
              .eq('organization_id', orgId);

            if (!error && data) {
              return data.map((att: any) => ({
                id: att.id,
                name: att.name,
                email: att.email || '',
                role: att.role || 'Miembro',
                avatarUrl: att.avatar_url || '',
                organizationId: att.organization_id
              }));
            }
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

  async saveAttendees(attendees: Attendee[]): Promise<StorageMutationResult> {
    localStorage.setItem('minuteflow_attendees', JSON.stringify(attendees));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const rows = attendees.map((att) => ({
          id: att.id,
          organization_id: att.organizationId || 'org-redq',
          name: att.name,
          email: att.email,
          role: att.role || 'Miembro',
          avatar_url: att.avatarUrl || null
        }));

        if (rows.length > 0) {
          return execSupabaseWrite('saveAttendees', () =>
            supabase.from('attendees').upsert(rows)
          );
        }
      }
    }
    return { success: true };
  },

  // ================= CARPETAS / DIRECTORIOS =================
  async getDirectories(orgId: string): Promise<DirectoryItem[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data, error } = await supabase
              .from('directories')
              .select('*')
              .eq('organization_id', orgId);

            if (!error && data) {
              return data.map((d: any) => ({
                id: d.id,
                name: d.name,
                count: 0,
                icon: 'folder',
                organizationId: d.organization_id
              }));
            }
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

  async saveDirectories(directories: DirectoryItem[]): Promise<StorageMutationResult> {
    localStorage.setItem('minuteflow_directories', JSON.stringify(directories));

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const rows = directories.map((d) => ({
          id: d.id,
          organization_id: d.organizationId || 'org-redq',
          name: d.name,
          color: '#4f46e5'
        }));

        if (rows.length > 0) {
          return execSupabaseWrite('saveDirectories', () =>
            supabase.from('directories').upsert(rows)
          );
        }
      }
    }
    return { success: true };
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
  },

  // ================= SINCRONIZACIÓN CLOUD COMPLETA =================
  async syncAll(orgId: string): Promise<{
    success: boolean;
    message: string;
    minutes: MeetingMinute[];
    actionItems: ActionItem[];
    attendees: Attendee[];
    directories: DirectoryItem[];
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase no está configurado. Operando con caché local.',
        minutes: await this.getMinutes(orgId),
        actionItems: await this.getActionItems(orgId),
        attendees: await this.getAttendees(orgId),
        directories: await this.getDirectories(orgId)
      };
    }

    try {
      const [minutes, actionItems, attendees, directories] = await Promise.all([
        this.getMinutes(orgId),
        this.getActionItems(orgId),
        this.getAttendees(orgId),
        this.getDirectories(orgId)
      ]);

      return {
        success: true,
        message: `Sincronización completa: ${minutes.length} actas y ${actionItems.length} compromisos verificados.`,
        minutes,
        actionItems,
        attendees,
        directories
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de sincronización con Supabase';
      return {
        success: false,
        message: msg,
        minutes: await this.getMinutes(orgId),
        actionItems: await this.getActionItems(orgId),
        attendees: await this.getAttendees(orgId),
        directories: await this.getDirectories(orgId)
      };
    }
  }
};
