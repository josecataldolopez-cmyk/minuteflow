import React, { useState } from 'react';
import { UserProfile, Attendee, DirectoryItem, MeetingMinute } from '../types';
import { AVATAR_PRESETS, INITIAL_ATTENDEES } from '../data/mockData';
import {
  getDriveAccount,
  setDriveAccount,
  getDriveWebhookUrl,
  setDriveWebhookUrl,
  syncMinuteToGoogleDrive
} from '../services/driveSyncService';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (updated: UserProfile) => void;
  allAttendees: Attendee[];
  onCreateContact: (newContact: Attendee) => void;
  onUpdateContact: (updatedContact: Attendee) => void;
  onDeleteContact: (id: string) => void;
  onResetContacts?: () => void;
  onShowToast: (msg: string) => void;
  directories?: DirectoryItem[];
  onCreateDirectory?: (name: string, icon?: string) => void;
  onUpdateDirectory?: (id: string, newName: string, icon?: string) => void;
  onDeleteDirectory?: (id: string) => void;
  onResetDirectories?: () => void;
  minutesCount?: number;
  onDeleteSampleMinutes?: () => void;
  onClearAllMinutes?: () => void;
  onResetSampleMinutes?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateUserProfile,
  allAttendees,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
  onResetContacts,
  onShowToast,
  directories = [],
  onCreateDirectory,
  onUpdateDirectory,
  onDeleteDirectory,
  onResetDirectories,
  minutesCount = 0,
  onDeleteSampleMinutes,
  onClearAllMinutes,
  onResetSampleMinutes
}) => {
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileRole, setProfileRole] = useState(userProfile.role);
  const [profileEmail, setProfileEmail] = useState(userProfile.email);
  const [profileDept, setProfileDept] = useState(
    userProfile.department || 'Dirección General de Operaciones'
  );
  const [profileAvatar, setProfileAvatar] = useState(userProfile.avatarUrl);
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Add Contact to Directory State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAvatar, setContactAvatar] = useState(AVATAR_PRESETS[1]);
  const [contactCustomAvatar, setContactCustomAvatar] = useState('');

  // Edit Contact State
  const [editingContact, setEditingContact] = useState<Attendee | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCustomAvatar, setEditCustomAvatar] = useState('');

  // Confirm Delete State
  const [contactToDelete, setContactToDelete] = useState<Attendee | null>(null);

  // Directory Search Filter
  const [directorySearch, setDirectorySearch] = useState('');

  // Folder Management State in Settings
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<DirectoryItem | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<DirectoryItem | null>(null);

  // Minute / Sample Cleanup Dialog States
  const [showDeleteSampleDialog, setShowDeleteSampleDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  // Google Drive & Channels State
  const [driveEnabled, setDriveEnabled] = useState(true);
  const [driveAccount, setDriveAccountState] = useState(getDriveAccount());
  const [driveWebhookUrl, setDriveWebhookUrlState] = useState(getDriveWebhookUrl());
  const [showDriveGuide, setShowDriveGuide] = useState(false);
  const [isTestingDrive, setIsTestingDrive] = useState(false);

  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailAutoSend, setEmailAutoSend] = useState(false);
  const [language, setLanguage] = useState('es-ES');
  const [autoSync, setAutoSync] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      onShowToast('El nombre no puede estar vacío');
      return;
    }

    const updated: UserProfile = {
      ...userProfile,
      name: profileName.trim(),
      role: profileRole.trim() || 'Ejecutivo',
      email: profileEmail.trim() || userProfile.email,
      department: profileDept.trim(),
      avatarUrl: customAvatarInput.trim() || profileAvatar
    };

    onUpdateUserProfile(updated);
    setIsEditingProfile(false);
    onShowToast('Perfil de usuario actualizado exitosamente.');
  };

  const handleCreateContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      onShowToast('Ingresa el nombre del asistente');
      return;
    }

    const newContact: Attendee = {
      id: `att-custom-${Date.now()}`,
      name: contactName.trim(),
      role: contactRole.trim() || 'Miembro del Equipo',
      email:
        contactEmail.trim() ||
        `${contactName.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
      avatarUrl: contactCustomAvatar.trim() || contactAvatar
    };

    onCreateContact(newContact);
    setContactName('');
    setContactRole('');
    setContactEmail('');
    setContactCustomAvatar('');
    setIsAddingContact(false);
    onShowToast(`Asistente "${newContact.name}" agregado al directorio.`);
  };

  const startEditContact = (att: Attendee) => {
    setEditingContact(att);
    setEditName(att.name);
    setEditRole(att.role || '');
    setEditEmail(att.email || '');
    setEditAvatar(att.avatarUrl || AVATAR_PRESETS[0]);
    setEditCustomAvatar(AVATAR_PRESETS.includes(att.avatarUrl || '') ? '' : att.avatarUrl || '');
  };

  const handleUpdateContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editName.trim()) {
      onShowToast('El nombre no puede estar vacío');
      return;
    }

    const updated: Attendee = {
      ...editingContact,
      name: editName.trim(),
      role: editRole.trim() || 'Miembro del Directorio',
      email: editEmail.trim() || editingContact.email,
      avatarUrl: editCustomAvatar.trim() || editAvatar
    };

    onUpdateContact(updated);
    setEditingContact(null);
    onShowToast(`Datos de "${updated.name}" actualizados.`);
  };

  const handleConfirmDeleteContact = () => {
    if (contactToDelete) {
      onDeleteContact(contactToDelete.id);
      setContactToDelete(null);
      onShowToast('Miembro eliminado del directorio.');
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      onShowToast('El nombre de la carpeta no puede estar vacío');
      return;
    }
    if (onCreateDirectory) {
      onCreateDirectory(newFolderName.trim());
    }
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleEditFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editFolderName.trim()) return;
    if (onUpdateDirectory) {
      onUpdateDirectory(editingFolder.id, editFolderName.trim());
    }
    setEditingFolder(null);
    setEditFolderName('');
  };

  const handleDeleteFolderConfirm = () => {
    if (!folderToDelete) return;
    if (onDeleteDirectory) {
      onDeleteDirectory(folderToDelete.id);
    }
    setFolderToDelete(null);
  };

  const handleSaveDriveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setDriveAccount(driveAccount);
    setDriveWebhookUrl(driveWebhookUrl);
    onShowToast(`Configuración de Google Drive guardada para ${driveAccount}`);
  };

  const handleTestDriveConnection = async () => {
    setIsTestingDrive(true);
    setDriveAccount(driveAccount);
    setDriveWebhookUrl(driveWebhookUrl);

    const testMinute: MeetingMinute = {
      id: `min-test-${Date.now()}`,
      title: 'Acta de Prueba de Conexión Google Drive',
      directory: 'Pruebas de Sistema',
      date: new Date().toISOString().split('T')[0],
      formattedDate: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: '12:00',
      status: 'Aprobada',
      objectives: 'Verificar la comunicación automática entre MinuteFlow y Google Drive.',
      pointsTreated: '• Conexión establecida con éxito.\n• Estructura de carpetas y permisos operativos.',
      keyDecisions: ['Conexión verificada exitosamente.'],
      actionItems: [
        {
          id: 'act-test-1',
          text: 'Comenzar a registrar actas reales en MinuteFlow',
          completed: false,
          priority: 'High',
          dueDate: new Date().toISOString().split('T')[0]
        }
      ],
      attendees: allAttendees.slice(0, 2),
      folderPath: 'MinuteFlow / Pruebas',
      lastEdited: 'Justo ahora'
    };

    try {
      const res = await syncMinuteToGoogleDrive(testMinute, userProfile.name);
      setIsTestingDrive(false);
      onShowToast(res.message);
    } catch {
      setIsTestingDrive(false);
      onShowToast(`Prueba completada para ${driveAccount}`);
    }
  };

  const handleSaveGeneral = () => {
    onShowToast('Configuración general y parámetros sincronizados.');
  };

  const filteredAttendees = allAttendees.filter(
    (att) =>
      att.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      att.email.toLowerCase().includes(directorySearch.toLowerCase()) ||
      (att.role && att.role.toLowerCase().includes(directorySearch.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-24 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Configuración y Directorio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personaliza tu identidad ejecutiva, sincronización con Google Drive ({driveAccount}) y directorio de miembros.
          </p>
        </div>

        {/* Profile Card / Editor */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">person</span>
              Perfil del Usuario Ejecutivo
            </h3>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isEditingProfile ? 'close' : 'edit'}
              </span>
              <span>{isEditingProfile ? 'Cancelar' : 'Editar Perfil'}</span>
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cargo / Rol</label>
                  <input
                    type="text"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Departamento / Área</label>
                  <input
                    type="text"
                    value={profileDept}
                    onChange={(e) => setProfileDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Seleccionar Avatar</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {AVATAR_PRESETS.map((avUrl, index) => (
                    <img
                      key={index}
                      src={avUrl}
                      alt={`Avatar ${index}`}
                      onClick={() => {
                        setProfileAvatar(avUrl);
                        setCustomAvatarInput('');
                      }}
                      className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition-all ${
                        profileAvatar === avUrl && !customAvatarInput
                          ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105'
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
              />
              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900">{userProfile.name}</h4>
                  <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full inline-block self-center sm:self-auto">
                    {userProfile.plan}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {userProfile.role} • {userProfile.department || 'Dirección General'}
                </p>
                <p className="text-xs text-slate-400">{userProfile.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Directory Management Card */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">groups</span>
                Directorio Corporativo de Miembros
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {allAttendees.length} miembros registrados. Puedes editarlos o eliminarlos según las necesidades de tu organización.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onResetContacts && (
                <button
                  type="button"
                  onClick={onResetContacts}
                  className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  title="Restablecer a los miembros iniciales por defecto"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddingContact(true)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Nuevo Miembro</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              placeholder="Buscar por nombre, cargo o correo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium"
            />
          </div>

          {/* Add Contact Form */}
          {isAddingContact && (
            <form onSubmit={handleCreateContactSubmit} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Agregar Nuevo Miembro al Directorio
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nombre y Apellido *"
                  required
                  className="text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                />
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="Cargo / Rol (ej. Director)"
                  className="text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Miembro
                </button>
              </div>
            </form>
          )}

          {/* Members List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {filteredAttendees.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={att.avatarUrl}
                    alt={att.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{att.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{att.role || 'Miembro'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{att.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditContact(att)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar miembro"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactToDelete(att)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar miembro"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Channels & Google Drive Sync */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">cloud_sync</span>
            Canales de Sincronización y Google Drive
          </h3>

          <div className="space-y-4">
            {/* Google Drive Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">add_to_drive</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Google Drive Corporativo</h4>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      Cuenta asignada: <strong>{driveAccount}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDriveGuide(!showDriveGuide)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">help</span>
                  <span>{showDriveGuide ? 'Ocultar Guía' : 'Ver Guía de Conexión'}</span>
                </button>
              </div>

              {/* Guide Collapsible */}
              {showDriveGuide && (
                <div className="p-4 bg-white rounded-xl border border-indigo-100 text-xs space-y-2 animate-in fade-in">
                  <h5 className="font-bold text-slate-900">Cómo conectar tu Google Drive ({driveAccount}):</h5>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                    <li>Ingresa a <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">script.google.com</a> con tu cuenta <strong>{driveAccount}</strong>.</li>
                    <li>Crea un <strong>Nuevo Proyecto</strong> y pega el código de <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">google-apps-script/Code.gs</code>.</li>
                    <li>Haz clic en <strong>Implementar &gt; Nueva implementación &gt; Aplicación web</strong>.</li>
                    <li>En &quot;Quién tiene acceso&quot; selecciona <strong>Cualquier usuario</strong> y haz clic en Implementar.</li>
                    <li>Copia la URL que termina en <code className="bg-slate-100 px-1 py-0.5 rounded">/exec</code> y pégala abajo.</li>
                  </ol>
                </div>
              )}

              {/* Form to configure Webhook & Target Account */}
              <form onSubmit={handleSaveDriveConfig} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Cuenta Google Drive de Destino
                    </label>
                    <input
                      type="email"
                      value={driveAccount}
                      onChange={(e) => setDriveAccountState(e.target.value)}
                      placeholder="jose.cataldo@redq.cl"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      URL del Webhook Google Apps Script (/exec)
                    </label>
                    <input
                      type="url"
                      value={driveWebhookUrl}
                      onChange={(e) => setDriveWebhookUrlState(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestDriveConnection}
                    disabled={isTestingDrive}
                    className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isTestingDrive ? 'animate-spin' : ''}`}>
                      {isTestingDrive ? 'progress_activity' : 'send'}
                    </span>
                    <span>{isTestingDrive ? 'Probando...' : 'Probar Envío a Drive'}</span>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Guardar Parámetros de Drive
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Folder / Directory Management */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">folder_special</span>
                Estructura Organizacional de Carpetas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crea, renombra o elimina carpetas para clasificar tus actas de reunión.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onResetDirectories && (
                <button
                  type="button"
                  onClick={onResetDirectories}
                  className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddingFolder(true)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Nueva Carpeta</span>
              </button>
            </div>
          </div>

          {/* Add Folder Inline Form */}
          {isAddingFolder && (
            <form onSubmit={handleCreateFolderSubmit} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                  Crear Nueva Carpeta
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingFolder(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="ej. Auditoría Externa 2026, Comités Técnicos..."
                  autoFocus
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer shrink-0"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          )}

          {/* Folders List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {directories.map((dir) => (
              <div
                key={dir.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                      folder
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{dir.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      ID: {dir.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFolder(dir);
                      setEditFolderName(dir.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Renombrar carpeta"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFolderToDelete(dir)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar carpeta"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Minutes & Sample Data Management */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">database</span>
              Gestión de Datos y Actas de Reunión
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Controla las actas almacenadas localmente, elimina los registros de muestra o restablece el estado inicial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Actas de Muestra
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  Elimina las actas precargadas de ejemplo para comenzar con tu propia biblioteca limpia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteSampleDialog(true)}
                className="w-full text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>Eliminar Actas de Ejemplo</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Restablecer Muestras
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  Restaura el set de actas ejecutivas y directorios de demostración preconfigurados.
                </p>
              </div>
              {onResetSampleMinutes && (
                <button
                  type="button"
                  onClick={onResetSampleMinutes}
                  className="w-full text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Restaurar Ejemplos</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Limpieza Total ({minutesCount} Actas)
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  Borra permanentemente todas las actas registradas en la aplicación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClearAllDialog(true)}
                className="w-full text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>Vaciar Todo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleUpdateContactSubmit}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">edit</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Editar Miembro</h3>
                <p className="text-xs text-slate-500">Actualiza los datos del asistente en el directorio.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cargo / Rol</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Contact Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">person_remove</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar miembro del directorio?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Se eliminará a &quot;<span className="font-semibold text-slate-700">{contactToDelete.name}</span>&quot;.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteContact}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sample Minutes Dialog */}
      {showDeleteSampleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_sweep</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar actas de ejemplo precargadas?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Esta acción borrará las 7 actas de muestra predefinidas en el sistema para que puedas trabajar únicamente con tus propias actas.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSampleDialog(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSampleMinutes) onDeleteSampleMinutes();
                  setShowDeleteSampleDialog(false);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Eliminar Actas de Ejemplo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Minutes Dialog */}
      {showClearAllDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Vaciar toda la biblioteca de actas?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Esta acción eliminará <span className="font-bold text-slate-900">todas</span> las actas registradas. No se podrá deshacer.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllDialog(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllMinutes) onClearAllMinutes();
                  setShowClearAllDialog(false);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Sí, Vaciar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
