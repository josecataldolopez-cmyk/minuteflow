import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';

const LibraryView = lazy(() => import('./components/LibraryView').then((m) => ({ default: m.LibraryView })));
const MinuteEditorView = lazy(() => import('./components/MinuteEditorView').then((m) => ({ default: m.MinuteEditorView })));
const ExportShareModal = lazy(() => import('./components/ExportShareModal').then((m) => ({ default: m.ExportShareModal })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const PrivacyPolicyModal = lazy(() => import('./components/PrivacyPolicyModal').then((m) => ({ default: m.PrivacyPolicyModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const InstitutionOnboardingModal = lazy(() => import('./components/InstitutionOnboardingModal').then((m) => ({ default: m.InstitutionOnboardingModal })));
import { storageService } from './services/storageService';
import { getSupabase, isSupabaseConfigured } from './services/supabaseClient';
import { openGoogleCalendarEvent, downloadIcsFile } from './services/calendarService';
import { clearOAuthSession } from './services/googleDriveOAuthService';
import {
  MeetingMinute,
  ViewMode,
  ActionItem,
  Attendee,
  UserProfile,
  DirectoryItem,
  Organization,
  UserRole
} from './types';
import {
  INITIAL_MINUTES,
  INITIAL_ACTION_ITEMS,
  INITIAL_SCHEDULE,
  INITIAL_DIRECTORIES,
  INITIAL_ATTENDEES,
  INITIAL_USER_PROFILE,
  INITIAL_ORGANIZATIONS
} from './data/mockData';

const CURRENT_DATA_VERSION = 'v2_multitenant_redq_2026';

export default function App() {
  // Verificación y migración segura de datos sin destruir actas creadas por el usuario
  useEffect(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) {
      localStorage.setItem('minuteflow_version', CURRENT_DATA_VERSION);

      // Solo inicializar si las claves no existían previamente en el navegador
      if (!localStorage.getItem('minuteflow_organizations')) {
        localStorage.setItem('minuteflow_organizations', JSON.stringify(INITIAL_ORGANIZATIONS));
        setOrganizations(INITIAL_ORGANIZATIONS);
      }
      if (!localStorage.getItem('minuteflow_current_org_id')) {
        localStorage.setItem('minuteflow_current_org_id', 'org-redq');
        setCurrentOrgId('org-redq');
      }
      if (!localStorage.getItem('minuteflow_user_profile')) {
        localStorage.setItem('minuteflow_user_profile', JSON.stringify(INITIAL_USER_PROFILE));
        setUserProfile(INITIAL_USER_PROFILE);
      }
      if (!localStorage.getItem('minuteflow_minutes')) {
        localStorage.setItem('minuteflow_minutes', JSON.stringify(INITIAL_MINUTES));
        setMinutes(INITIAL_MINUTES);
      }
      if (!localStorage.getItem('minuteflow_action_items')) {
        localStorage.setItem('minuteflow_action_items', JSON.stringify(INITIAL_ACTION_ITEMS));
        setActionItems(INITIAL_ACTION_ITEMS);
      }
      if (!localStorage.getItem('minuteflow_attendees')) {
        localStorage.setItem('minuteflow_attendees', JSON.stringify(INITIAL_ATTENDEES));
        setAllAttendees(INITIAL_ATTENDEES);
      }
      if (!localStorage.getItem('minuteflow_directories')) {
        localStorage.setItem('minuteflow_directories', JSON.stringify(INITIAL_DIRECTORIES));
        setDirectories(INITIAL_DIRECTORIES);
      }
    }
  }, []);

  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Privacy & Terms Compliance Modal
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'terms'>('privacy');

  // Listen to URL hash (#privacy or #terms) for direct deep linking
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#privacy' || hash === '#privacidad') {
        setPrivacyModalTab('privacy');
        setIsPrivacyModalOpen(true);
      } else if (hash === '#terms' || hash === '#terminos') {
        setPrivacyModalTab('terms');
        setIsPrivacyModalOpen(true);
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  // Organizations (Tenants) State
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('minuteflow_organizations');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [currentOrgId, setCurrentOrgId] = useState<string>(() => {
    return localStorage.getItem('minuteflow_current_org_id') || 'org-redq';
  });

  // Supabase Auth State (Fase 1: Identidad & Tenancy Real)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsInstitutionOnboarding, setNeedsInstitutionOnboarding] = useState(false);
  const [scheduledMinuteNotification, setScheduledMinuteNotification] = useState<MeetingMinute | null>(null);

  // Monitor Supabase Authentication
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        handleFetchUserProfileFromAuth(session.user.id, session.user.email || '');
      }
    });

    // Listen to changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        handleFetchUserProfileFromAuth(session.user.id, session.user.email || '');
      } else {
        setIsAuthenticated(false);
        if (event === 'SIGNED_OUT') {
          clearSessionData();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFetchUserProfileFromAuth = async (userId: string, email: string) => {
    try {
      const profile = await storageService.getProfileFromSupabase(userId);
      if (profile && !profile.organizationId) {
        // Usuario nuevo sin institución: limpiar datos demo y abrir onboarding
        setUserProfile(profile);
        setOrganizations([]);
        setCurrentOrgId('');
        setMinutes([]);
        setActionItems([]);
        setAllAttendees([]);
        setDirectories([]);
        setSchedule([]);
        setNeedsInstitutionOnboarding(true);
        return;
      }

      if (profile && profile.organizationId) {
        setNeedsInstitutionOnboarding(false);
        setUserProfile(profile);
        setCurrentOrgId(profile.organizationId);
        localStorage.setItem('minuteflow_current_org_id', profile.organizationId);
        handleCloudSync(profile.organizationId);
      } else {
        const orgs = await storageService.getOrganizations();
        if (orgs.length === 0) {
          setUserProfile((prev) => ({
            ...prev,
            id: userId,
            email: email,
            name: email.split('@')[0] || prev.name,
            organizationId: '',
            systemRole: 'admin',
            role: 'Administrador'
          }));
          setOrganizations([]);
          setCurrentOrgId('');
          setMinutes([]);
          setActionItems([]);
          setAllAttendees([]);
          setDirectories([]);
          setSchedule([]);
          setNeedsInstitutionOnboarding(true);
          return;
        }
        setUserProfile((prev) => ({
          ...prev,
          id: userId,
          email: email,
          name: email.split('@')[0] || prev.name
        }));
        handleCloudSync(currentOrgId);
      }
    } catch {
      // Ignorar fallback
    }
  };

  const clearSessionData = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('minuteflow_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
    if (currentOrgId) {
      clearOAuthSession(currentOrgId);
    }
    setNeedsInstitutionOnboarding(false);
    setOrganizations([]);
    setCurrentOrgId('');
    setMinutes([]);
    setActionItems([]);
    setAllAttendees([]);
    setDirectories([]);
    setSchedule([]);
    setActiveMinute(null);
    setScheduledMinuteNotification(null);
    setCurrentView('dashboard');
    setUserProfile({
      id: '',
      name: 'Invitado',
      email: '',
      role: 'Lector',
      systemRole: 'reader',
      avatarUrl: '',
      organizationId: '',
      organizationName: 'PactaCloud',
    });
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    setIsAuthenticated(false);
    clearSessionData();
    setIsAuthModalOpen(true);
    showToast('Sesión cerrada y datos locales limpiados');
  };

  // Current Organization helper
  const currentOrganization = useMemo<Organization>(() => {
    return (
      organizations.find((o) => o.id === currentOrgId) ||
      organizations[0] || {
        id: '',
        name: 'PactaCloud',
        code: 'PC',
        domain: '',
        driveAccount: '',
        plan: 'FREE',
        primaryColor: '#4f46e5',
      }
    );
  }, [organizations, currentOrgId]);

  // User Profile State with local storage
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('minuteflow_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_USER_PROFILE,
          ...parsed,
          organizationId: parsed.organizationId || currentOrgId,
          organizationName: parsed.organizationName || currentOrganization.name,
          systemRole: parsed.systemRole || 'admin'
        };
      } catch {
        return INITIAL_USER_PROFILE;
      }
    }
    return INITIAL_USER_PROFILE;
  });

  // Core Data with Local Storage fallback
  const [minutes, setMinutes] = useState<MeetingMinute[]>(() => {
    const saved = localStorage.getItem('minuteflow_minutes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_MINUTES;
      }
    }
    return INITIAL_MINUTES;
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const saved = localStorage.getItem('minuteflow_action_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ACTION_ITEMS;
      }
    }
    return INITIAL_ACTION_ITEMS;
  });

  const [allAttendees, setAllAttendees] = useState<Attendee[]>(() => {
    const saved = localStorage.getItem('minuteflow_attendees');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ATTENDEES;
      }
    }
    return INITIAL_ATTENDEES;
  });

  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);

  const [directories, setDirectories] = useState<DirectoryItem[]>(() => {
    const saved = localStorage.getItem('minuteflow_directories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DIRECTORIES;
      }
    }
    return INITIAL_DIRECTORIES;
  });

  // Active Editor and Modal States
  const [activeMinute, setActiveMinute] = useState<MeetingMinute | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTargetMinute, setExportTargetMinute] = useState<MeetingMinute | null>(null);

  // Search & Status
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist data on change (LocalStorage only; Supabase uses granular mutations)
  useEffect(() => {
    storageService.saveOrganizationsLocal(organizations);
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('minuteflow_current_org_id', currentOrgId);
  }, [currentOrgId]);

  useEffect(() => {
    storageService.saveMinutesLocal(minutes);
  }, [minutes]);

  useEffect(() => {
    storageService.saveActionItemsLocal(actionItems);
  }, [actionItems]);

  useEffect(() => {
    storageService.saveAttendeesLocal(allAttendees);
  }, [allAttendees]);

  useEffect(() => {
    storageService.saveDirectoriesLocal(directories);
  }, [directories]);

  useEffect(() => {
    storageService.saveUserProfile(userProfile);
  }, [userProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Switch Active Organization
  const handleSelectOrganization = (org: Organization) => {
    setCurrentOrgId(org.id);
    setUserProfile((prev) => ({
      ...prev,
      organizationId: org.id,
      organizationName: org.name
    }));
    setActiveMinute(null);
    setCurrentView('dashboard');
    showToast(`Conectado al espacio aislado de "${org.name}"`);
  };

  // Change simulated role (Admin / Editor / Reader)
  const handleChangeUserRole = (newRole: UserRole) => {
    setUserProfile((prev) => ({
      ...prev,
      systemRole: newRole
    }));
    showToast(`Rol actualizado a "${newRole === 'admin' ? 'Administrador' : newRole === 'editor' ? 'Editor' : 'Lector'}"`);
  };

  // Update Organization Settings (by Admin)
  const handleUpdateOrganization = (updated: Organization) => {
    setOrganizations((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    if (updated.id === currentOrgId) {
      setUserProfile((prev) => ({
        ...prev,
        organizationName: updated.name
      }));
    }
    storageService.updateSingleOrganization(updated).then((res) => {
      if (!res.success && res.error) {
        showToast(`Error al guardar organización en nube: ${res.error}`);
      }
    });
  };

  // Purgar organizaciones de prueba para dejar únicamente el establecimiento activo del usuario
  const handlePurgeDemoOrganizations = () => {
    const kept = organizations.filter((o) => o.id === currentOrgId);
    setOrganizations(kept);
    localStorage.setItem('minuteflow_organizations', JSON.stringify(kept));
    setMinutes((prev) => {
      const filtered = prev.filter((m) => (m.organizationId || 'org-redq') === currentOrgId);
      localStorage.setItem('minuteflow_minutes', JSON.stringify(filtered));
      return filtered;
    });
    setActionItems((prev) => {
      const filtered = prev.filter((a) => (a.organizationId || 'org-redq') === currentOrgId);
      localStorage.setItem('minuteflow_action_items', JSON.stringify(filtered));
      return filtered;
    });
    setDirectories((prev) => {
      const filtered = prev.filter((d) => (d.organizationId || 'org-redq') === currentOrgId);
      localStorage.setItem('minuteflow_directories', JSON.stringify(filtered));
      return filtered;
    });
    setAllAttendees((prev) => {
      const filtered = prev.filter((a) => (a.organizationId || 'org-redq') === currentOrgId);
      localStorage.setItem('minuteflow_attendees', JSON.stringify(filtered));
      return filtered;
    });
    showToast(`Se han eliminado los demás establecimientos de prueba. Tu cuenta ahora contiene exclusivamente "${currentOrganization.name}".`);
  };

  // Strict Scoped Multi-Tenant Filtering:
  // Garantiza que ningún usuario de una organización acceda a actas, carpetas ni miembros de otra.
  const scopedMinutes = useMemo(() => {
    return minutes.filter((m) => (m.organizationId || 'org-redq') === currentOrgId);
  }, [minutes, currentOrgId]);

  const scopedDirectories = useMemo(() => {
    return directories.filter((d) => (d.organizationId || 'org-redq') === currentOrgId);
  }, [directories, currentOrgId]);

  const scopedAttendees = useMemo(() => {
    return allAttendees.filter((a) => (a.organizationId || 'org-redq') === currentOrgId);
  }, [allAttendees, currentOrgId]);

  const scopedActionItems = useMemo(() => {
    return actionItems.filter((act) => (act.organizationId || 'org-redq') === currentOrgId);
  }, [actionItems, currentOrgId]);

  const scopedSchedule = useMemo(() => {
    return schedule.filter((s) => (s.organizationId || 'org-redq') === currentOrgId);
  }, [schedule, currentOrgId]);

  // Directory / Folder Operations (Scoped to current organization)
  const handleCreateDirectory = (name: string, icon: string = 'folder') => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('El nombre de la carpeta no puede estar vacío');
      return;
    }
    if (scopedDirectories.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Ya existe una carpeta con ese nombre en ${currentOrganization.name}`);
      return;
    }
    const newDir: DirectoryItem = {
      id: `dir-${Date.now()}`,
      name: trimmed,
      count: 0,
      icon: icon || 'folder',
      organizationId: currentOrgId
    };
    setDirectories((prev) => [...prev, newDir]);
    storageService.saveSingleDirectory(newDir).then((res) => {
      if (!res.success && res.error) showToast(`Error al crear carpeta en nube: ${res.error}`);
    });
    showToast(`Carpeta "${trimmed}" creada en ${currentOrganization.name}`);
  };

  const handleUpdateDirectory = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      showToast('El nombre de la carpeta no puede estar vacío');
      return;
    }
    const target = directories.find((d) => d.id === id);
    if (!target) return;

    const updatedDir = { ...target, name: trimmed };
    setDirectories((prev) =>
      prev.map((d) => (d.id === id ? updatedDir : d))
    );
    storageService.saveSingleDirectory(updatedDir).then((res) => {
      if (!res.success && res.error) showToast(`Error al renombrar carpeta en nube: ${res.error}`);
    });

    // Actualizar las actas asociadas dentro de esta organización
    setMinutes((prev) =>
      prev.map((m) =>
        (m.organizationId || 'org-redq') === currentOrgId && m.directory === target.name
          ? { ...m, directory: trimmed, folderPath: `${trimmed} / Notas` }
          : m
      )
    );
    showToast(`Carpeta renombrada a "${trimmed}"`);
  };

  const handleDeleteDirectory = (id: string) => {
    const target = directories.find((d) => d.id === id);
    if (!target) return;

    const remaining = scopedDirectories.filter((d) => d.id !== id);
    const fallbackDirName = remaining.length > 0 ? remaining[0].name : 'General';

    setMinutes((prev) =>
      prev.map((m) =>
        (m.organizationId || 'org-redq') === currentOrgId && m.directory === target.name
          ? { ...m, directory: fallbackDirName, folderPath: `${fallbackDirName} / Notas` }
          : m
      )
    );

    setDirectories((prev) => prev.filter((d) => d.id !== id));
    storageService.deleteSingleDirectory(id).then((res) => {
      if (!res.success && res.error) showToast(`Error al eliminar carpeta en nube: ${res.error}`);
    });
    showToast(`Carpeta "${target.name}" eliminada`);
  };

  const handleResetDirectories = () => {
    const otherOrgsDirs = directories.filter((d) => (d.organizationId || 'org-redq') !== currentOrgId);
    const initialForThisOrg = INITIAL_DIRECTORIES.filter((d) => (d.organizationId || 'org-redq') === currentOrgId);
    setDirectories([...otherOrgsDirs, ...initialForThisOrg]);
    showToast(`Carpetas de ${currentOrganization.name} restablecidas`);
  };

  // Minutes CRUD Operations (Scoped to current organization)
  const handleSaveMinute = (updatedMinute: MeetingMinute, isDraft: boolean) => {
    const minuteWithOrg: MeetingMinute = {
      ...updatedMinute,
      organizationId: updatedMinute.organizationId || currentOrgId
    };

    const exists = minutes.some((m) => m.id === minuteWithOrg.id);
    let newMinutesList: MeetingMinute[];

    if (exists) {
      newMinutesList = minutes.map((m) => (m.id === minuteWithOrg.id ? minuteWithOrg : m));
      showToast(isDraft ? 'Borrador actualizado con éxito' : 'Acta aprobada y guardada con éxito');
    } else {
      newMinutesList = [minuteWithOrg, ...minutes];
      showToast(isDraft ? 'Nuevo borrador creado' : 'Nueva acta oficial aprobada');
    }

    setMinutes(newMinutesList);

    // Sincronizar compromisos de esta acta
    const otherActions = actionItems.filter((a) => a.sourceMinuteId !== minuteWithOrg.id);
    const newActionsFromMinute: ActionItem[] = minuteWithOrg.actionItems.map((act) => ({
      ...act,
      sourceMinuteId: minuteWithOrg.id,
      sourceMinuteTitle: minuteWithOrg.title,
      organizationId: currentOrgId
    }));
    setActionItems([...newActionsFromMinute, ...otherActions]);

    // Guardado granular atómico en Supabase (solo esta acta y sus compromisos)
    storageService.saveSingleMinute(minuteWithOrg, newActionsFromMinute).then((res) => {
      if (!res.success && res.error) {
        showToast(`Error al sincronizar acta en nube: ${res.error}`);
      }
    });

    // Abrir Google Calendar si el usuario activó la casilla de próxima sesión
    if (minuteWithOrg.syncCalendar && minuteWithOrg.nextSessionDate) {
      setScheduledMinuteNotification(minuteWithOrg);
      try {
        openGoogleCalendarEvent(minuteWithOrg, currentOrganization.name);
      } catch {
        // En caso de bloqueo de popups del navegador
      }
    }

    setActiveMinute(null);
    setCurrentView('library');
  };

  const handleDeleteMinute = (id: string) => {
    setMinutes((prev) => prev.filter((m) => m.id !== id));
    setActionItems((prev) => prev.filter((a) => a.sourceMinuteId !== id));
    storageService.deleteMinute(id).then((res) => {
      if (!res.success && res.error) {
        showToast(`Error al eliminar en nube: ${res.error}`);
      } else {
        showToast('Acta eliminada del sistema');
      }
    });
  };

  const handleDuplicateMinute = (minuteToDup: MeetingMinute) => {
    const newId = `min-${Date.now()}`;
    const duplicatedActions = minuteToDup.actionItems.map((act, idx) => ({
      ...act,
      id: `act-${Date.now()}-${idx}`,
      sourceMinuteId: newId,
      sourceMinuteTitle: `${minuteToDup.title} (Copia)`,
      organizationId: currentOrgId
    }));
    const duplicated: MeetingMinute = {
      ...minuteToDup,
      id: newId,
      title: `${minuteToDup.title} (Copia)`,
      date: new Date().toISOString().split('T')[0],
      formattedDate: new Date().toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'Borrador',
      lastEdited: 'Justo ahora',
      organizationId: currentOrgId,
      actionItems: duplicatedActions
    };
    setMinutes((prev) => [duplicated, ...prev]);
    setActionItems((prev) => [...duplicatedActions, ...prev]);
    storageService.saveSingleMinute(duplicated, duplicatedActions).then((res) => {
      if (!res.success && res.error) {
        showToast(`Error al duplicar acta en nube: ${res.error}`);
      }
    });
    showToast(`Acta duplicada como borrador en ${currentOrganization.name}`);
  };

  const handleDeleteSampleMinutes = () => {
    const toRemove = minutes.filter(
      (m) => (m.organizationId || 'org-redq') === currentOrgId && m.id.startsWith('min-')
    );
    setMinutes((prev) =>
      prev.filter((m) => (m.organizationId || 'org-redq') !== currentOrgId || !m.id.startsWith('min-'))
    );
    Promise.all(toRemove.map((m) => storageService.deleteMinute(m.id)));
    showToast(`Actas de muestra eliminadas para ${currentOrganization.name}`);
  };

  const handleClearAllMinutes = () => {
    const toRemove = minutes.filter((m) => (m.organizationId || 'org-redq') === currentOrgId);
    setMinutes((prev) => prev.filter((m) => (m.organizationId || 'org-redq') !== currentOrgId));
    setActionItems((prev) => prev.filter((a) => (a.organizationId || 'org-redq') !== currentOrgId));
    Promise.all(toRemove.map((m) => storageService.deleteMinute(m.id)));
    showToast(`Todas las actas de ${currentOrganization.name} fueron eliminadas`);
  };

  const handleResetSampleMinutes = () => {
    const otherOrgsMinutes = minutes.filter((m) => (m.organizationId || 'org-redq') !== currentOrgId);
    const initialForThisOrg = INITIAL_MINUTES.filter((m) => (m.organizationId || 'org-redq') === currentOrgId);
    setMinutes([...initialForThisOrg, ...otherOrgsMinutes]);
    showToast(`Actas de ejemplo restauradas para ${currentOrganization.name}`);
  };

  // Action Items Operations
  const handleToggleActionItem = (id: string) => {
    const target = actionItems.find((item) => item.id === id);
    if (!target) return;

    const updatedItem: ActionItem = { ...target, completed: !target.completed };

    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item))
    );

    // Mantener consistencia bidireccional dentro de minute.actionItems (FUN-02)
    setMinutes((prev) =>
      prev.map((m) =>
        m.id === target.sourceMinuteId
          ? {
              ...m,
              actionItems: m.actionItems.map((act) =>
                act.id === id ? { ...act, completed: updatedItem.completed } : act
              )
            }
          : m
      )
    );

    storageService.saveSingleActionItem(updatedItem).then((res) => {
      if (!res.success && res.error) {
        showToast(`Error al actualizar compromiso en nube: ${res.error}`);
      }
    });
  };

  const handleAddActionItem = (
    textOrItem: string | ActionItem,
    dueDate?: string,
    priority: 'Low' | 'Medium' | 'High' = 'Medium',
    assignedTo?: Attendee
  ) => {
    let newItem: ActionItem;
    if (typeof textOrItem === 'string') {
      const cleanText = textOrItem.trim();
      if (!cleanText) return;
      newItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: cleanText,
        completed: false,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        priority: priority || 'Medium',
        assignedTo,
        organizationId: currentOrgId
      };
    } else {
      newItem = {
        ...textOrItem,
        id: textOrItem.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        completed: textOrItem.completed ?? false,
        organizationId: currentOrgId
      };
    }
    setActionItems((prev) => [newItem, ...prev]);
    storageService.saveSingleActionItem(newItem).then((res) => {
      if (!res.success && res.error) {
        showToast(`Error al guardar compromiso en nube: ${res.error}`);
      } else {
        showToast('Nueva tarea añadida a los compromisos');
      }
    });
  };

  // Contact / Directory Operations
  const handleCreateContact = (newContact: Attendee) => {
    const scopedContact = { ...newContact, organizationId: currentOrgId };
    setAllAttendees((prev) => [scopedContact, ...prev]);
    storageService.saveSingleAttendee(scopedContact).then((res) => {
      if (!res.success && res.error) showToast(`Error al guardar contacto en nube: ${res.error}`);
    });
  };

  const handleUpdateContact = (updatedContact: Attendee) => {
    const scopedContact = { ...updatedContact, organizationId: currentOrgId };
    setAllAttendees((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? scopedContact : c))
    );
    storageService.saveSingleAttendee(scopedContact).then((res) => {
      if (!res.success && res.error) showToast(`Error al actualizar contacto en nube: ${res.error}`);
    });
  };

  const handleDeleteContact = (id: string) => {
    setAllAttendees((prev) => prev.filter((c) => c.id !== id));
    storageService.deleteSingleAttendee(id).then((res) => {
      if (!res.success && res.error) showToast(`Error al eliminar contacto en nube: ${res.error}`);
    });
  };

  const handleResetContacts = () => {
    const otherAttendees = allAttendees.filter((a) => (a.organizationId || 'org-redq') !== currentOrgId);
    const initialForThisOrg = INITIAL_ATTENDEES.filter((a) => (a.organizationId || 'org-redq') === currentOrgId);
    setAllAttendees([...otherAttendees, ...initialForThisOrg]);
    showToast(`Directorio de ${currentOrganization.name} restablecido`);
  };

  const handleUpdateUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    showToast('Perfil de usuario actualizado con éxito');
  };

  // Export Modal
  const handleOpenExport = (minute: MeetingMinute) => {
    setExportTargetMinute(minute);
    setExportModalOpen(true);
  };

  const handleNewMinute = () => {
    setActiveMinute(null);
    setCurrentView('editor');
  };

  const handleSelectMinute = (minute: MeetingMinute) => {
    setActiveMinute(minute);
    setCurrentView('editor');
  };

  const handleCloudSync = async (orgId: string = currentOrgId) => {
    setIsSyncing(true);
    try {
      const syncResult = await storageService.syncAll(orgId);
      if (syncResult.success) {
        if (syncResult.organizations.length > 0) {
          setOrganizations(syncResult.organizations);
        }
        setMinutes(syncResult.minutes);
        setActionItems(syncResult.actionItems);
        setAllAttendees(syncResult.attendees);
        setDirectories(syncResult.directories);
        setSchedule([]);
      }
      showToast(syncResult.message);
    } catch {
      showToast('No se pudo completar la sincronización con Supabase');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTriggerSync = () => {
    handleCloudSync(currentOrgId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Desktop Side Navigation Bar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onNewMinute={handleNewMinute}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        currentOrganization={currentOrganization}
        onOpenPrivacy={() => {
          setPrivacyModalTab('privacy');
          setIsPrivacyModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:text-xs focus:font-bold"
        >
          Saltar al contenido principal
        </a>
        {/* Top App Bar with Multi-Tenant Organization Switcher */}
        <TopAppBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          minutes={scopedMinutes}
          onSelectMinute={handleSelectMinute}
          currentView={currentView}
          onNavigate={(v) => setCurrentView(v)}
          userProfile={userProfile}
          organizations={organizations}
          currentOrganization={currentOrganization}
          onSelectOrganization={handleSelectOrganization}
          onChangeUserRole={handleChangeUserRole}
          isAuthenticated={isAuthenticated}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Dynamic Views (Strictly scoped by organization) */}
        <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ErrorBoundary fallbackTitle="Inconveniente en la vista principal">
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-12 text-slate-500 gap-3">
                <span className="material-symbols-outlined animate-spin text-indigo-600">progress_activity</span>
                <span className="text-sm font-medium">Cargando módulo...</span>
              </div>
            }
          >
            {currentView === 'dashboard' && (
              <DashboardView
                schedule={scopedSchedule}
                actionItems={scopedActionItems}
                recentMinutes={scopedMinutes}
                allAttendees={scopedAttendees}
                onToggleActionItem={handleToggleActionItem}
                onAddActionItem={handleAddActionItem}
                onSelectMinute={handleSelectMinute}
                onOpenExport={handleOpenExport}
                onNewMinute={handleNewMinute}
                onNavigate={(v) => setCurrentView(v)}
                userProfile={userProfile}
              />
            )}

            {currentView === 'library' && (
              <LibraryView
                minutes={scopedMinutes}
                directories={scopedDirectories}
                onSelectMinute={handleSelectMinute}
                onOpenExport={handleOpenExport}
                onDeleteMinute={handleDeleteMinute}
                onDuplicateMinute={handleDuplicateMinute}
                onNewMinute={handleNewMinute}
                onCreateDirectory={handleCreateDirectory}
                onUpdateDirectory={handleUpdateDirectory}
                onDeleteDirectory={handleDeleteDirectory}
                onDeleteSampleMinutes={handleDeleteSampleMinutes}
                onClearAllMinutes={handleClearAllMinutes}
                onResetSampleMinutes={handleResetSampleMinutes}
                userRole={userProfile.systemRole}
              />
            )}

            {(currentView === 'editor' || currentView === 'projects') && (
              <MinuteEditorView
                minute={activeMinute}
                directories={scopedDirectories}
                onSave={handleSaveMinute}
                onOpenExport={handleOpenExport}
                onBack={() => setCurrentView('library')}
                allAttendees={scopedAttendees}
                onCreateContact={handleCreateContact}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
                onCreateDirectory={handleCreateDirectory}
                onDeleteMinute={handleDeleteMinute}
                currentOrganization={currentOrganization}
                userRole={userProfile.systemRole}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                onShowToast={showToast}
                userProfile={userProfile}
                onUpdateUserProfile={handleUpdateUserProfile}
                allAttendees={scopedAttendees}
                onCreateContact={handleCreateContact}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
                onResetContacts={handleResetContacts}
                directories={scopedDirectories}
                onCreateDirectory={handleCreateDirectory}
                onUpdateDirectory={handleUpdateDirectory}
                onDeleteDirectory={handleDeleteDirectory}
                onResetDirectories={handleResetDirectories}
                minutesCount={scopedMinutes.length}
                onDeleteSampleMinutes={handleDeleteSampleMinutes}
                onClearAllMinutes={handleClearAllMinutes}
                onResetSampleMinutes={handleResetSampleMinutes}
                currentOrganization={currentOrganization}
                onUpdateOrganization={handleUpdateOrganization}
                userRole={userProfile.systemRole}
                hasMultipleOrgs={organizations.length > 1}
                onPurgeDemoOrganizations={handlePurgeDemoOrganizations}
              />
            )}
          </Suspense>
        </ErrorBoundary>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden w-full h-16 bg-white border-t border-slate-200/80 flex justify-around items-center px-2 flex-shrink-0 z-30 pb-1 shadow-xs">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-0.5 text-xs font-medium cursor-pointer ${
              currentView === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentView === 'dashboard' ? 'material-symbols-fill text-indigo-600' : ''
              }`}
            >
              dashboard
            </span>
            <span>Inicio</span>
          </button>
          <button
            onClick={() => setCurrentView('library')}
            className={`flex flex-col items-center gap-0.5 text-xs font-medium cursor-pointer ${
              currentView === 'library' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentView === 'library' ? 'material-symbols-fill text-indigo-600' : ''
              }`}
            >
              folder
            </span>
            <span>Actas</span>
          </button>
          <button
            onClick={handleNewMinute}
            className="flex flex-col items-center gap-0.5 text-xs font-bold text-indigo-600 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center -mt-3 shadow-md">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </div>
            <span>Crear</span>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`flex flex-col items-center gap-0.5 text-xs font-medium cursor-pointer ${
              currentView === 'settings' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentView === 'settings' ? 'material-symbols-fill text-indigo-600' : ''
              }`}
            >
              settings
            </span>
            <span>Ajustes</span>
          </button>
        </nav>
      </div>

      <Suspense fallback={null}>
        {/* Export / Sincronización Modal (Scoped by Organization) */}
        <ExportShareModal
          minute={exportTargetMinute}
          isOpen={exportModalOpen}
          onClose={() => {
            setExportModalOpen(false);
            setExportTargetMinute(null);
          }}
          onExportSuccess={(channel) => {
            showToast(`Acta enviada con éxito vía ${channel}`);
          }}
          currentOrganization={currentOrganization}
          directories={scopedDirectories}
          onCreateDirectory={handleCreateDirectory}
        />

        {/* Supabase Authentication & Multi-Tenant Onboarding Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          availableOrganizations={organizations}
          onAuthSuccess={(userEmail, orgId) => {
            setIsAuthenticated(true);
            showToast(`¡Bienvenido a PactaCloud, ${userEmail}!`);
            if (orgId) {
              setCurrentOrgId(orgId);
              localStorage.setItem('minuteflow_current_org_id', orgId);
            }
          }}
        />

        {/* Onboarding de Nueva Institución (Espacio en blanco) */}
        <InstitutionOnboardingModal
          isOpen={needsInstitutionOnboarding}
          userEmail={userProfile.email}
          onComplete={(newOrg) => {
            setOrganizations([newOrg]);
            setCurrentOrgId(newOrg.id);
            localStorage.setItem('minuteflow_current_org_id', newOrg.id);
            setMinutes([]);
            setActionItems([]);
            setAllAttendees([]);
            setSchedule([]);
            setDirectories([
              {
                id: `dir-${Date.now()}`,
                name: 'Actas Generales',
                count: 0,
                icon: 'folder',
                organizationId: newOrg.id,
              },
            ]);
            setUserProfile((prev) => ({
              ...prev,
              organizationId: newOrg.id,
              organizationName: newOrg.name,
              role: 'Administrador',
              systemRole: 'admin',
            }));
            setNeedsInstitutionOnboarding(false);
            showToast(`¡Institución "${newOrg.name}" creada con éxito!`);
          }}
        />

        {/* Legal & Privacy Compliance Modal */}
        <PrivacyPolicyModal
          isOpen={isPrivacyModalOpen}
          onClose={() => {
            setIsPrivacyModalOpen(false);
            if (window.location.hash) {
              history.replaceState(null, '', window.location.pathname);
            }
          }}
          defaultTab={privacyModalTab}
        />
      </Suspense>

      {/* Floating Google Calendar Notification Banner */}
      {scheduledMinuteNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-amber-400 text-[22px]">calendar_month</span>
              <h2 className="text-sm font-bold text-white">Próxima Sesión Programada</h2>
            </div>
            <button
              type="button"
              onClick={() => setScheduledMinuteNotification(null)}
              aria-label="Cerrar aviso de Google Calendar"
              className="text-slate-300 hover:text-white p-1.5 rounded-lg cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-3 truncate">
            {scheduledMinuteNotification.title}
          </p>
          <div className="bg-slate-800/80 rounded-lg p-2 mb-3 text-[11px] text-slate-300 flex items-center justify-between border border-slate-700">
            <span>Fecha: <strong className="text-white">{scheduledMinuteNotification.nextSessionDate}</strong></span>
            <span>Hora: <strong className="text-white">{scheduledMinuteNotification.time || '10:00'} hrs</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                openGoogleCalendarEvent(scheduledMinuteNotification, currentOrganization.name);
                setScheduledMinuteNotification(null);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Abrir en Google Calendar</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[12px]">open_in_new</span>
            </button>
            <button
              type="button"
              onClick={() => {
                downloadIcsFile(scheduledMinuteNotification, currentOrganization.name);
                setScheduledMinuteNotification(null);
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all border border-slate-700"
              title="Descargar archivo .ics"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>.ics</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Security & Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
