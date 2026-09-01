import React, { useState } from 'react';
import { UserProfile, Attendee, DirectoryItem } from '../types';
import { AVATAR_PRESETS, INITIAL_ATTENDEES } from '../data/mockData';

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

  // System Settings State
  const [driveEnabled, setDriveEnabled] = useState(true);
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

  const handleSaveContactEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    if (!editName.trim()) {
      onShowToast('El nombre no puede estar vacío.');
      return;
    }

    const updated: Attendee = {
      ...editingContact,
      name: editName.trim(),
      role: editRole.trim() || 'Asistente / Miembro',
      email: editEmail.trim() || `${editName.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
      avatarUrl: editCustomAvatar.trim() || editAvatar || AVATAR_PRESETS[0]
    };

    onUpdateContact(updated);
    setEditingContact(null);
    onShowToast(`Información de "${updated.name}" actualizada con éxito.`);
  };

  const handleConfirmDeleteContact = () => {
    if (contactToDelete) {
      onDeleteContact(contactToDelete.id);
      onShowToast(`"${contactToDelete.name}" eliminado del directorio.`);
      setContactToDelete(null);
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
            Personaliza tu identidad ejecutiva, edita o elimina miembros del directorio corporativo y configura canales de exportación.
          </p>
        </div>

        {/* Profile Card / Editor */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">person</span>
              Perfil del Usuario Ejecutivo
            </h3>
            {!isEditingProfile ? (
              <button
                onClick={() => {
                  setProfileName(userProfile.name);
                  setProfileRole(userProfile.role);
                  setProfileEmail(userProfile.email);
                  setProfileDept(userProfile.department || '');
                  setProfileAvatar(userProfile.avatarUrl);
                  setIsEditingProfile(true);
                }}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar Perfil</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-600 shadow-sm shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <h4 className="font-bold text-lg text-slate-900 truncate">{userProfile.name}</h4>
                <p className="text-xs text-slate-600 font-medium">
                  {userProfile.role} • {userProfile.department || 'Dirección General'}
                </p>
                <p className="text-xs text-indigo-600 font-medium">{userProfile.email}</p>
              </div>
              <div className="sm:ml-auto shrink-0">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  {userProfile.plan || 'Plan Enterprise Activo'}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="ej. José Cataldo López"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cargo / Título Ejecutivo
                  </label>
                  <input
                    type="text"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    placeholder="ej. Director General, Vicepresidente"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="jose.cataldo@empresa.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Departamento u Organización
                  </label>
                  <input
                    type="text"
                    value={profileDept}
                    onChange={(e) => setProfileDept(e.target.value)}
                    placeholder="ej. Consejo Directivo, Operaciones"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Seleccionar Foto de Perfil / Avatar
                </label>
                <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfileAvatar(preset);
                        setCustomAvatarInput('');
                      }}
                      className={`relative rounded-full p-0.5 transition-all cursor-pointer shrink-0 ${
                        profileAvatar === preset && !customAvatarInput
                          ? 'ring-2 ring-indigo-600 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset}
                        alt="Avatar preset"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  placeholder="O ingresa un enlace (URL) de foto personalizada..."
                  className="w-full text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar Perfil</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Directory & Attendees Management (Full Edit & Delete for all members) */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">contacts</span>
                Directorio de Asistentes y Miembros ({allAttendees.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edita, agrega o elimina cualquier participante precargado o personalizado.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onResetContacts && (
                <button
                  onClick={onResetContacts}
                  className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Restaurar la lista original de asistentes"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsAddingContact(!isAddingContact);
                  setEditingContact(null);
                }}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-1.5 rounded-xl shadow-sm shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>+ Añadir Asistente</span>
              </button>
            </div>
          </div>

          {/* Search Directory Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              placeholder="Buscar miembros por nombre, cargo o correo electrónico..."
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Delete Confirmation Modal / Banner */}
          {contactToDelete && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <img
                  src={contactToDelete.avatarUrl}
                  alt={contactToDelete.name}
                  className="w-10 h-10 rounded-full object-cover border border-rose-300 shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-rose-900">
                    ¿Eliminar a &quot;{contactToDelete.name}&quot; del directorio?
                  </h4>
                  <p className="text-[11px] text-rose-600">
                    {contactToDelete.role} • {contactToDelete.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setContactToDelete(null)}
                  className="text-xs font-semibold px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteContact}
                  className="text-xs font-bold px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          )}

          {/* Quick Add Contact Form */}
          {isAddingContact && (
            <form
              onSubmit={handleCreateContactSubmit}
              className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3 animate-in fade-in"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-indigo-600">person_add</span>
                  Registrar Nuevo Asistente en el Directorio
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="ej. Dra. Claudia Rivas"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="ej. Auditora Externa"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="claudia.r@empresa.com"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Avatar Selector for Contact */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-medium text-slate-500 mr-1">Foto:</span>
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setContactAvatar(preset);
                        setContactCustomAvatar('');
                      }}
                      className={`p-0.5 rounded-full cursor-pointer ${
                        contactAvatar === preset && !contactCustomAvatar ? 'ring-2 ring-indigo-600' : 'opacity-70'
                      }`}
                    >
                      <img src={preset} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={contactCustomAvatar}
                    onChange={(e) => setContactCustomAvatar(e.target.value)}
                    placeholder="O URL de foto..."
                    className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white flex-1 sm:w-40"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Edit Contact Modal / Inline Form */}
          {editingContact && (
            <form
              onSubmit={handleSaveContactEdit}
              className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">edit</span>
                  Editando Asistente: &quot;{editingContact.name}&quot;
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Avatar Selector for Editing */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-medium text-slate-600 mr-1">Foto:</span>
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditAvatar(preset);
                        setEditCustomAvatar('');
                      }}
                      className={`p-0.5 rounded-full cursor-pointer ${
                        editAvatar === preset && !editCustomAvatar ? 'ring-2 ring-amber-600 scale-105' : 'opacity-70'
                      }`}
                    >
                      <img src={preset} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={editCustomAvatar}
                    onChange={(e) => setEditCustomAvatar(e.target.value)}
                    placeholder="O URL de imagen..."
                    className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white flex-1 sm:w-40"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingContact(null)}
                    className="text-xs text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer shrink-0"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Directory Contact Grid (All editable & deletable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {filteredAttendees.map((att) => {
              const isCustom = att.id.startsWith('att-custom-');
              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/70 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={att.avatarUrl}
                      alt={att.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{att.name}</h4>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            isCustom
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}
                        >
                          {isCustom ? 'Personalizado' : 'Equipo Base'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {att.role || 'Asistente'} • {att.email}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete for any member */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditContact(att)}
                      className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Editar datos del miembro"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactToDelete(att)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar del directorio"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredAttendees.length === 0 && (
              <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-slate-300 text-3xl">person_off</span>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  No se encontraron miembros coincidentes con &quot;{directorySearch}&quot;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connected Channels */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">cloud_sync</span>
            Canales de Sincronización y Exportación
          </h3>

          <div className="divide-y divide-slate-100">
            <div className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-[22px]">add_to_drive</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Google Drive</h4>
                  <p className="text-[11px] text-slate-500">
                    Exporta automáticamente carpetas de actas en formato PDF y Google Docs
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={driveEnabled}
                onChange={(e) => setDriveEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-[22px]">chat</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">WhatsApp Business</h4>
                  <p className="text-[11px] text-slate-500">
                    Distribución de síntesis ejecutiva y lista de compromisos por mensajería
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <span className="material-symbols-outlined text-[22px]">mail</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Envío Automático por Correo Institucional
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enviar acta oficial a todos los asistentes apenas se apruebe
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAutoSend}
                onChange={(e) => setEmailAutoSend(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
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

        {/* System Settings & Languages */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">tune</span>
            Preferencias de Idioma e Inteligencia
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Idioma de Transcripción y Dictado
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="es-ES">Español (Latinoamérica / España)</option>
                <option value="en-US">Inglés (English - US)</option>
                <option value="pt-BR">Portugués (Brasil)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sincronización Automática en Segundo Plano
              </label>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-600">Guardado continuo local</span>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={handleSaveGeneral}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      </div>

      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleEditFolderSubmit}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">edit</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Renombrar Carpeta</h3>
                <p className="text-xs text-slate-500">Actualiza el nombre de la carpeta para todas las actas asociadas.</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre de la carpeta</label>
              <input
                type="text"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingFolder(null)}
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

      {/* Delete Folder Confirm Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">folder_delete</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar carpeta "{folderToDelete.name}"?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Las actas asociadas a esta carpeta se reasignarán a la carpeta principal para no perder información.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteFolderConfirm}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Sí, Eliminar Carpeta
              </button>
            </div>
          </div>
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
                Se eliminará a "<span className="font-semibold text-slate-700">{contactToDelete.name}</span>".
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
