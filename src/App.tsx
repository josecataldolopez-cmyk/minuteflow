import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { MinuteEditorView } from './components/MinuteEditorView';
import { ExportShareModal } from './components/ExportShareModal';
import { SettingsView } from './components/SettingsView';
import { Toast } from './components/Toast';
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
  // Verificación y migración automática de caché local del navegador
  useEffect(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) {
      localStorage.setItem('minuteflow_version', CURRENT_DATA_VERSION);
      localStorage.setItem('minuteflow_organizations', JSON.stringify(INITIAL_ORGANIZATIONS));
      localStorage.setItem('minuteflow_current_org_id', 'org-redq');
      localStorage.setItem('minuteflow_user_profile', JSON.stringify(INITIAL_USER_PROFILE));
      localStorage.setItem('minuteflow_minutes', JSON.stringify(INITIAL_MINUTES));
      localStorage.setItem('minuteflow_action_items', JSON.stringify(INITIAL_ACTION_ITEMS));
      localStorage.setItem('minuteflow_attendees', JSON.stringify(INITIAL_ATTENDEES));
      localStorage.setItem('minuteflow_directories', JSON.stringify(INITIAL_DIRECTORIES));
      // Forzar recarga de estados en caso de versión previa
      setOrganizations(INITIAL_ORGANIZATIONS);
      setCurrentOrgId('org-redq');
      setUserProfile(INITIAL_USER_PROFILE);
      setMinutes(INITIAL_MINUTES);
      setActionItems(INITIAL_ACTION_ITEMS);
      setAllAttendees(INITIAL_ATTENDEES);
      setDirectories(INITIAL_DIRECTORIES);
    }
  }, []);

  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Organizations (Tenants) State
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) return INITIAL_ORGANIZATIONS;
    const saved = localStorage.getItem('minuteflow_organizations');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [currentOrgId, setCurrentOrgId] = useState<string>(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) return 'org-redq';
    return localStorage.getItem('minuteflow_current_org_id') || 'org-redq';
  });

  // Current Organization helper
  const currentOrganization = useMemo(() => {
    return organizations.find((o) => o.id === currentOrgId) || organizations[0] || INITIAL_ORGANIZATIONS[0];
  }, [organizations, currentOrgId]);

  // User Profile State with local storage
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) return INITIAL_USER_PROFILE;
    const saved = localStorage.getItem('minuteflow_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_USER_PROFILE,
        ...parsed,
        organizationId: parsed.organizationId || currentOrgId,
        organizationName: parsed.organizationName || currentOrganization.name,
        systemRole: parsed.systemRole || 'admin'
      };
    }
    return INITIAL_USER_PROFILE;
  });

  // Core Data with Local Storage fallback
  const [minutes, setMinutes] = useState<MeetingMinute[]>(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) return INITIAL_MINUTES;
    const saved = localStorage.getItem('minuteflow_minutes');
    return saved ? JSON.parse(saved) : INITIAL_MINUTES;
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) return INITIAL_ACTION_ITEMS;
    const saved = localStorage.getItem('minuteflow_action_items');
    return saved ? JSON.parse(saved) : INITIAL_ACTION_ITEMS;
  });

  const [allAttendees, setAllAttendees] = useState<Attendee[]>(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) return INITIAL_ATTENDEES;
    const saved = localStorage.getItem('minuteflow_attendees');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDEES;
  });

  const [schedule] = useState(INITIAL_SCHEDULE);

  const [directories, setDirectories] = useState<DirectoryItem[]>(() => {
    const savedVersion = localStorage.getItem('minuteflow_version');
    if (savedVersion !== CURRENT_DATA_VERSION) return INITIAL_DIRECTORIES;
    const saved = localStorage.getItem('minuteflow_directories');
    return saved ? JSON.parse(saved) : INITIAL_DIRECTORIES;
  });

  // Active Editor and Modal States
  const [activeMinute, setActiveMinute] = useState<MeetingMinute | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTargetMinute, setExportTargetMinute] = useState<MeetingMinute | null>(null);

  // Search & Status
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist data on change
  useEffect(() => {
    localStorage.setItem('minuteflow_organizations', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('minuteflow_current_org_id', currentOrgId);
  }, [currentOrgId]);

  useEffect(() => {
    localStorage.setItem('minuteflow_minutes', JSON.stringify(minutes));
  }, [minutes]);

  useEffect(() => {
    localStorage.setItem('minuteflow_action_items', JSON.stringify(actionItems));
  }, [actionItems]);

  useEffect(() => {
    localStorage.setItem('minuteflow_attendees', JSON.stringify(allAttendees));
  }, [allAttendees]);

  useEffect(() => {
    localStorage.setItem('minuteflow_directories', JSON.stringify(directories));
  }, [directories]);

  useEffect(() => {
    localStorage.setItem('minuteflow_user_profile', JSON.stringify(userProfile));
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

    setDirectories((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: trimmed } : d))
    );

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

    setActiveMinute(null);
    setCurrentView('library');
  };

  const handleDeleteMinute = (id: string) => {
    setMinutes((prev) => prev.filter((m) => m.id !== id));
    setActionItems((prev) => prev.filter((a) => a.sourceMinuteId !== id));
    showToast('Acta eliminada del sistema');
  };

  const handleDuplicateMinute = (minuteToDup: MeetingMinute) => {
    const duplicated: MeetingMinute = {
      ...minuteToDup,
      id: `min-${Date.now()}`,
      title: `${minuteToDup.title} (Copia)`,
      date: new Date().toISOString().split('T')[0],
      formattedDate: new Date().toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'Borrador',
      lastEdited: 'Justo ahora',
      organizationId: currentOrgId
    };
    setMinutes((prev) => [duplicated, ...prev]);
    showToast(`Acta duplicada como borrador en ${currentOrganization.name}`);
  };

  const handleDeleteSampleMinutes = () => {
    setMinutes((prev) =>
      prev.filter((m) => (m.organizationId || 'org-redq') !== currentOrgId || !m.id.startsWith('min-'))
    );
    showToast(`Actas de muestra eliminadas para ${currentOrganization.name}`);
  };

  const handleClearAllMinutes = () => {
    setMinutes((prev) => prev.filter((m) => (m.organizationId || 'org-redq') !== currentOrgId));
    setActionItems((prev) => prev.filter((a) => (a.organizationId || 'org-redq') !== currentOrgId));
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
    setActionItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleAddActionItem = (item: ActionItem) => {
    setActionItems((prev) => [{ ...item, organizationId: currentOrgId }, ...prev]);
    showToast('Nueva tarea añadida a los compromisos');
  };

  // Contact / Directory Operations
  const handleCreateContact = (newContact: Attendee) => {
    setAllAttendees((prev) => [{ ...newContact, organizationId: currentOrgId }, ...prev]);
  };

  const handleUpdateContact = (updatedContact: Attendee) => {
    setAllAttendees((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? { ...updatedContact, organizationId: currentOrgId } : c))
    );
  };

  const handleDeleteContact = (id: string) => {
    setAllAttendees((prev) => prev.filter((c) => c.id !== id));
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

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast(`Sincronización completa con el espacio de ${currentOrganization.name}`);
    }, 1200);
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
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
        />

        {/* Dynamic Views (Strictly scoped by organization) */}
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
          />
        )}

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

      {/* Global Security & Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
