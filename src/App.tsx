import { useState, useEffect } from 'react';
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
  DirectoryItem
} from './types';
import {
  INITIAL_MINUTES,
  INITIAL_ACTION_ITEMS,
  INITIAL_SCHEDULE,
  INITIAL_DIRECTORIES,
  INITIAL_ATTENDEES,
  INITIAL_USER_PROFILE
} from './data/mockData';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // User Profile State with local storage
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('minuteflow_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  // Core Data with Local Storage fallback
  const [minutes, setMinutes] = useState<MeetingMinute[]>(() => {
    const saved = localStorage.getItem('minuteflow_minutes');
    return saved ? JSON.parse(saved) : INITIAL_MINUTES;
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const saved = localStorage.getItem('minuteflow_action_items');
    return saved ? JSON.parse(saved) : INITIAL_ACTION_ITEMS;
  });

  const [allAttendees, setAllAttendees] = useState<Attendee[]>(() => {
    const saved = localStorage.getItem('minuteflow_attendees');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDEES;
  });

  const [schedule] = useState(INITIAL_SCHEDULE);
  const [directories, setDirectories] = useState<DirectoryItem[]>(() => {
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

  // Directory / Folder Operations
  const handleCreateDirectory = (name: string, icon: string = 'folder') => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('El nombre de la carpeta no puede estar vacío');
      return;
    }
    if (directories.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Ya existe una carpeta con ese nombre');
      return;
    }
    const newDir: DirectoryItem = {
      id: `dir-${Date.now()}`,
      name: trimmed,
      count: 0,
      icon: icon || 'folder'
    };
    setDirectories((prev) => [...prev, newDir]);
    showToast(`Carpeta "${trimmed}" creada con éxito`);
  };

  const handleUpdateDirectory = (id: string, newName: string, icon?: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      showToast('El nombre de la carpeta no puede estar vacío');
      return;
    }
    const target = directories.find((d) => d.id === id);
    if (!target) return;

    const oldName = target.name;
    setDirectories((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: trimmed, icon: icon || d.icon } : d))
    );

    // Update all minutes that were in the old directory
    setMinutes((prev) =>
      prev.map((m) => (m.directory === oldName ? { ...m, directory: trimmed } : m))
    );

    // Also update active minute if open
    if (activeMinute && activeMinute.directory === oldName) {
      setActiveMinute((prev) => (prev ? { ...prev, directory: trimmed } : null));
    }

    showToast(`Carpeta renombrada a "${trimmed}"`);
  };

  const handleDeleteDirectory = (id: string) => {
    const target = directories.find((d) => d.id === id);
    if (!target) return;

    const fallbackDir = directories.find((d) => d.id !== id)?.name || 'General';
    setDirectories((prev) => prev.filter((d) => d.id !== id));

    // Reassign minutes that belonged to this directory
    setMinutes((prev) =>
      prev.map((m) => (m.directory === target.name ? { ...m, directory: fallbackDir } : m))
    );

    showToast(`Carpeta "${target.name}" eliminada`);
  };

  const handleResetDirectories = () => {
    setDirectories(INITIAL_DIRECTORIES);
    showToast('Carpetas restablecidas a la configuración inicial');
  };

  // Minutes bulk / sample cleanup operations
  const handleDeleteSampleMinutes = () => {
    // Delete initial sample minutes (min-1 to min-7) or all initial minutes
    const initialIds = new Set(INITIAL_MINUTES.map((m) => m.id));
    setMinutes((prev) => prev.filter((m) => !initialIds.has(m.id)));
    showToast('Actas de ejemplo eliminadas');
  };

  const handleClearAllMinutes = () => {
    setMinutes([]);
    showToast('Todas las actas han sido eliminadas');
  };

  const handleResetSampleMinutes = () => {
    setMinutes(INITIAL_MINUTES);
    showToast('Actas de ejemplo restauradas');
  };

  // Actions
  const handleNewMinute = () => {
    setActiveMinute(null);
    setCurrentView('editor');
  };

  const handleSelectMinute = (min: MeetingMinute) => {
    setActiveMinute(min);
    setCurrentView('editor');
  };

  const handleOpenExport = (min: MeetingMinute) => {
    setExportTargetMinute(min);
    setExportModalOpen(true);
  };

  const handleSaveMinute = (savedMinute: MeetingMinute, isDraft: boolean) => {
    setMinutes((prev) => {
      const exists = prev.some((m) => m.id === savedMinute.id);
      if (exists) {
        return prev.map((m) => (m.id === savedMinute.id ? savedMinute : m));
      } else {
        return [savedMinute, ...prev];
      }
    });

    // Also update global action items if any new ones were added
    if (savedMinute.actionItems && savedMinute.actionItems.length > 0) {
      setActionItems((prev) => {
        const newActions = [...prev];
        savedMinute.actionItems.forEach((newItem) => {
          const idx = newActions.findIndex((a) => a.id === newItem.id);
          if (idx >= 0) {
            newActions[idx] = newItem;
          } else {
            newActions.unshift(newItem);
          }
        });
        return newActions;
      });
    }

    showToast(isDraft ? 'Borrador guardado con éxito' : 'Acta publicada y sincronizada');
    setActiveMinute(savedMinute);
    setCurrentView('library');
  };

  const handleDeleteMinute = (id: string) => {
    setMinutes((prev) => prev.filter((m) => m.id !== id));
    showToast('Acta de reunión eliminada');
  };

  const handleDuplicateMinute = (min: MeetingMinute) => {
    const duplicated: MeetingMinute = {
      ...min,
      id: `min-${Date.now()}`,
      title: `${min.title} (Copia)`,
      status: 'Borrador',
      formattedDate: 'Hoy'
    };
    setMinutes((prev) => [duplicated, ...prev]);
    showToast('Acta duplicada en Borradores');
  };

  const handleToggleActionItem = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddActionItem = (
    text: string,
    dueDate?: string,
    priority?: 'Low' | 'Medium' | 'High',
    assignedTo?: Attendee
  ) => {
    const defaultDate = dueDate || new Date().toISOString().split('T')[0];
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      text,
      completed: false,
      dueLabel: defaultDate === '2026-08-31' ? 'Vence Hoy' : `Vence ${defaultDate}`,
      dueDate: defaultDate,
      priority: priority || 'Medium',
      assignedTo: assignedTo || allAttendees[0]
    };
    setActionItems((prev) => [newItem, ...prev]);
    showToast('Tarea y compromiso agregado');
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Sincronización en la nube completada: 7 carpetas al día');
    }, 1200);
  };

  const handleExportSuccess = (channel: string) => {
    const channelNames: Record<string, string> = {
      drive: 'Google Drive (PDF y Google Doc generados)',
      whatsapp: 'WhatsApp (Resumen Ejecutivo distribuido)',
      email: 'Correo Corporativo (Archivo PDF adjunto enviado)'
    };
    showToast(`Exportado con éxito a ${channelNames[channel] || channel}`);
  };

  const handleCreateContact = (newContact: Attendee) => {
    setAllAttendees((prev) => {
      if (prev.some((a) => a.id === newContact.id)) return prev;
      return [newContact, ...prev];
    });
    showToast(`Asistente "${newContact.name}" agregado al directorio`);
  };

  const handleUpdateContact = (updatedContact: Attendee) => {
    setAllAttendees((prev) =>
      prev.map((a) => (a.id === updatedContact.id ? updatedContact : a))
    );
    // Also update in minutes state if an attendee is embedded
    setMinutes((prev) =>
      prev.map((m) => ({
        ...m,
        attendees: m.attendees.map((a) =>
          a.id === updatedContact.id ? updatedContact : a
        ),
        actionItems: m.actionItems.map((item) =>
          item.assignedTo?.id === updatedContact.id
            ? { ...item, assignedTo: updatedContact }
            : item
        )
      }))
    );
    // Also update active minute if open
    if (activeMinute) {
      setActiveMinute((prev) =>
        prev
          ? {
              ...prev,
              attendees: prev.attendees.map((a) =>
                a.id === updatedContact.id ? updatedContact : a
              ),
              actionItems: prev.actionItems.map((item) =>
                item.assignedTo?.id === updatedContact.id
                  ? { ...item, assignedTo: updatedContact }
                  : item
              )
            }
          : null
      );
    }
    // Also update global actionItems
    setActionItems((prev) =>
      prev.map((item) =>
        item.assignedTo?.id === updatedContact.id
          ? { ...item, assignedTo: updatedContact }
          : item
      )
    );
    showToast(`Asistente "${updatedContact.name}" actualizado`);
  };

  const handleDeleteContact = (id: string) => {
    setAllAttendees((prev) => prev.filter((a) => a.id !== id));
    showToast('Contacto eliminado del directorio');
  };

  const handleResetContacts = () => {
    setAllAttendees(INITIAL_ATTENDEES);
    showToast('Directorio restablecido a los miembros base predeterminados');
  };

  const handleUpdateUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    showToast('Perfil de usuario actualizado con éxito');
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top App Bar */}
        <TopAppBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          minutes={minutes}
          onSelectMinute={handleSelectMinute}
          currentView={currentView}
          onNavigate={(v) => setCurrentView(v)}
          userProfile={userProfile}
        />

        {/* Dynamic Views */}
        {currentView === 'dashboard' && (
          <DashboardView
            schedule={schedule}
            actionItems={actionItems}
            recentMinutes={minutes}
            allAttendees={allAttendees}
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
            minutes={minutes}
            directories={directories}
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
          />
        )}

        {(currentView === 'editor' || currentView === 'projects') && (
          <MinuteEditorView
            minute={activeMinute}
            directories={directories}
            onSave={handleSaveMinute}
            onOpenExport={handleOpenExport}
            onBack={() => setCurrentView('library')}
            allAttendees={allAttendees}
            onCreateContact={handleCreateContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onCreateDirectory={handleCreateDirectory}
            onDeleteMinute={handleDeleteMinute}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            onShowToast={showToast}
            userProfile={userProfile}
            onUpdateUserProfile={handleUpdateUserProfile}
            allAttendees={allAttendees}
            onCreateContact={handleCreateContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onResetContacts={handleResetContacts}
            directories={directories}
            onCreateDirectory={handleCreateDirectory}
            onUpdateDirectory={handleUpdateDirectory}
            onDeleteDirectory={handleDeleteDirectory}
            onResetDirectories={handleResetDirectories}
            minutesCount={minutes.length}
            onDeleteSampleMinutes={handleDeleteSampleMinutes}
            onClearAllMinutes={handleClearAllMinutes}
            onResetSampleMinutes={handleResetSampleMinutes}
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
            <span className="text-[10px]">Panel</span>
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
              inventory_2
            </span>
            <span className="text-[10px]">Biblioteca</span>
          </button>

          <button
            onClick={handleNewMinute}
            className="flex flex-col items-center justify-center -mt-5 bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-full shadow-lg shadow-indigo-200 cursor-pointer transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>

          <button
            onClick={() => setCurrentView('editor')}
            className={`flex flex-col items-center gap-0.5 text-xs font-medium cursor-pointer ${
              currentView === 'editor' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentView === 'editor' ? 'material-symbols-fill text-indigo-600' : ''
              }`}
            >
              edit_document
            </span>
            <span className="text-[10px]">Editor</span>
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
            <span className="text-[10px]">Ajustes</span>
          </button>
        </nav>
      </div>

      {/* Export & Share Modal */}
      <ExportShareModal
        minute={exportTargetMinute}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExportSuccess={handleExportSuccess}
      />

      {/* Global Toast Alert */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
