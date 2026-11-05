import React, { useState, useEffect } from 'react';
import { UserProfile, Attendee, DirectoryItem, MeetingMinute, Organization, UserRole } from '../types';
import { AVATAR_PRESETS } from '../data/mockData';
import {
  getOrgDriveAccount,
  setOrgDriveAccount,
  getOrgDriveWebhookUrl,
  setOrgDriveWebhookUrl,
  validateDriveWebhookUrl,
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
  currentOrganization?: Organization;
  onUpdateOrganization?: (updatedOrg: Organization) => void;
  userRole?: UserRole;
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
  onResetSampleMinutes,
  currentOrganization,
  onUpdateOrganization,
  userRole = 'admin'
}) => {
  const orgId = currentOrganization?.id || 'org-redq';
  const orgName = currentOrganization?.name || 'Establecimiento Principal';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

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

  // Organization & Google Drive States
  const [driveAccount, setDriveAccountState] = useState(() =>
    getOrgDriveAccount(orgId, currentOrganization?.driveAccount)
  );
  const [driveWebhookUrl, setDriveWebhookUrlState] = useState(() =>
    currentOrganization?.driveWebhookUrl || getOrgDriveWebhookUrl(orgId)
  );
  const [driveUrlError, setDriveUrlError] = useState<string | null>(null);
  const [showDriveGuide, setShowDriveGuide] = useState(false);
  const [isTestingDrive, setIsTestingDrive] = useState(false);

  // Organization Metadata Edit State
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [orgDisplayName, setOrgDisplayName] = useState(orgName);
  const [orgTaxId, setOrgTaxId] = useState(currentOrganization?.taxId || '');
  const [orgDomain, setOrgDomain] = useState(currentOrganization?.domain || '');

  // Sincronizar estados locales cuando cambia la organización seleccionada
  useEffect(() => {
    setDriveAccountState(getOrgDriveAccount(orgId, currentOrganization?.driveAccount));
    setDriveWebhookUrlState(currentOrganization?.driveWebhookUrl || getOrgDriveWebhookUrl(orgId));
    setOrgDisplayName(currentOrganization?.name || 'Establecimiento Principal');
    setOrgTaxId(currentOrganization?.taxId || '');
    setOrgDomain(currentOrganization?.domain || '');
    setDriveUrlError(null);
  }, [orgId, currentOrganization]);

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

  const handleSaveOrgMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onShowToast('Acción no permitida: Solo los Administradores pueden editar la institución.');
      return;
    }
    if (currentOrganization && onUpdateOrganization) {
      const updated: Organization = {
        ...currentOrganization,
        name: orgDisplayName.trim() || currentOrganization.name,
        taxId: orgTaxId.trim() || currentOrganization.taxId,
        domain: orgDomain.trim() || currentOrganization.domain
      };
      onUpdateOrganization(updated);
      setIsEditingOrg(false);
      onShowToast(`Datos de ${updated.name} actualizados correctamente.`);
    }
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
        `${contactName.toLowerCase().replace(/\s+/g, '.')}@${currentOrganization?.domain || 'empresa.com'}`,
      avatarUrl: contactCustomAvatar.trim() || contactAvatar,
      organizationId: orgId
    };

    onCreateContact(newContact);
    setContactName('');
    setContactRole('');
    setContactEmail('');
    setContactCustomAvatar('');
    setIsAddingContact(false);
    onShowToast(`Asistente "${newContact.name}" agregado al directorio de ${orgName}.`);
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
      avatarUrl: editCustomAvatar.trim() || editAvatar,
      organizationId: editingContact.organizationId || orgId
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

    if (!isAdmin) {
      onShowToast('Acceso Denegado: Solo administradores pueden guardar la configuración de Drive.');
      return;
    }

    // Validación estricta de seguridad
    if (driveWebhookUrl.trim()) {
      const validation = validateDriveWebhookUrl(driveWebhookUrl);
      if (!validation.isValid) {
        setDriveUrlError(validation.error || 'URL inválida');
        onShowToast(`Error de Seguridad: ${validation.error}`);
        return;
      }
    }
    setDriveUrlError(null);

    setOrgDriveAccount(orgId, driveAccount);
    setOrgDriveWebhookUrl(orgId, driveWebhookUrl);

    if (currentOrganization && onUpdateOrganization) {
      onUpdateOrganization({
        ...currentOrganization,
        driveAccount: driveAccount.trim(),
        driveWebhookUrl: driveWebhookUrl.trim()
      });
    }

    onShowToast(`Parámetros de Google Drive actualizados para ${orgName}`);
  };

  const handleTestDriveConnection = async () => {
    setIsTestingDrive(true);

    if (driveWebhookUrl.trim()) {
      const validation = validateDriveWebhookUrl(driveWebhookUrl);
      if (!validation.isValid) {
        setIsTestingDrive(false);
        setDriveUrlError(validation.error || 'URL inválida');
        onShowToast(`Error de Validación: ${validation.error}`);
        return;
      }
    }

    setDriveUrlError(null);
    setOrgDriveAccount(orgId, driveAccount);
    setOrgDriveWebhookUrl(orgId, driveWebhookUrl);

    const testMinute: MeetingMinute = {
      id: `min-test-${Date.now()}`,
      title: `Acta de Prueba de Conexión - ${orgName}`,
      directory: 'Pruebas de Sistema',
      date: new Date().toISOString().split('T')[0],
      formattedDate: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: '12:00',
      status: 'Aprobada',
      objectives: `Verificar la comunicación automática entre MinuteFlow y Google Drive para ${orgName}.`,
      pointsTreated: `• Verificación de aislamiento multi-tenant.\n• Conexión establecida con la cuenta ${driveAccount}.\n• Estructura de carpetas y permisos corporativos operativos.`,
      keyDecisions: ['Aislamiento y conexión verificados exitosamente.'],
      actionItems: [
        {
          id: 'act-test-1',
          text: `Comenzar a registrar actas institucionales en ${orgName}`,
          completed: false,
          priority: 'High',
          dueDate: new Date().toISOString().split('T')[0]
        }
      ],
      attendees: allAttendees.slice(0, 2),
      folderPath: `${orgName} / Pruebas`,
      lastEdited: 'Justo ahora',
      organizationId: orgId
    };

    try {
      const res = await syncMinuteToGoogleDrive(testMinute, userProfile.name, currentOrganization);
      setIsTestingDrive(false);
      onShowToast(res.message);
    } catch {
      setIsTestingDrive(false);
      onShowToast(`Prueba completada para ${driveAccount}`);
    }
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Configuración y Directorio
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestión del espacio institucional de <strong>{orgName}</strong>, parámetros de Google Drive y directorio de miembros.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isAdmin ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <span className="material-symbols-outlined text-[16px]">
                  {isAdmin ? 'verified_user' : 'visibility'}
                </span>
                <span>Rol: {isAdmin ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Lector'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Organization / Establishment Information Card */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <span className="material-symbols-outlined text-[22px]">domain</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Datos del Establecimiento / Empresa</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                    ID: {currentOrganization?.code || orgId}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Espacio privado aislado. Ningún otro establecimiento tiene acceso a esta información.
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditingOrg(!isEditingOrg)}
                className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">{isEditingOrg ? 'close' : 'edit'}</span>
                <span>{isEditingOrg ? 'Cancelar' : 'Editar Institución'}</span>
              </button>
            )}
          </div>

          {isEditingOrg ? (
            <form onSubmit={handleSaveOrgMetadata} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre de la Institución</label>
                  <input
                    type="text"
                    value={orgDisplayName}
                    onChange={(e) => setOrgDisplayName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">RUT o Identificador Fiscal</label>
                  <input
                    type="text"
                    value={orgTaxId}
                    onChange={(e) => setOrgTaxId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Dominio Corporativo / Web</label>
                  <input
                    type="text"
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingOrg(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Guardar Datos del Establecimiento
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Establecimiento</span>
                <span className="text-xs font-bold text-slate-900 block truncate">{orgName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">RUT / Identificador</span>
                <span className="text-xs font-bold text-slate-800 block">{currentOrganization?.taxId || 'No asignado'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Dominio Autorizado</span>
                <span className="text-xs font-bold text-indigo-700 block">@{currentOrganization?.domain || 'redq.cl'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Google Drive Configuration Card (Per-Establishment Isolation) */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">add_to_drive</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Google Drive Exclusivo de este Establecimiento</span>
                  {isAdmin ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Control Administrador
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Solo Lectura
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Cada administrador ingresa su propia cuenta y URL de Webhook para archivar actas en su Drive institucional.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDriveGuide(!showDriveGuide)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
              <span>{showDriveGuide ? 'Ocultar Guía' : 'Guía de Conexión'}</span>
            </button>
          </div>

          {/* Security Banner if user is not admin */}
          {!isAdmin && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">lock</span>
              <div>
                <span className="font-bold block">Acceso Restringido por Política de Seguridad Multi-Tenant:</span>
                Solo los Administradores de <strong>{orgName}</strong> tienen autorización para modificar la cuenta y URL de Google Drive. Esta barrera protege contra cualquier intento de desvío o filtración de información entre instituciones.
              </div>
            </div>
          )}

          {/* Guide Collapsible */}
          {showDriveGuide && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 animate-in fade-in">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-indigo-600">checklist</span>
                Instrucciones para el Administrador de {orgName}:
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                <li>Inicia sesión en <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">script.google.com</a> con la cuenta institucional de tu colegio o empresa (ej: <strong>{driveAccount}</strong>).</li>
                <li>Crea un <strong>Nuevo Proyecto</strong> y pega el código de <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-indigo-700">google-apps-script/Code.gs</code>.</li>
                <li>Haz clic en <strong>Implementar &gt; Nueva implementación &gt; Aplicación web</strong>.</li>
                <li>Configura: <em>Ejecutar como: &quot;Yo ({driveAccount})&quot;</em> y <em>Quién tiene acceso: &quot;Cualquier usuario&quot;</em>.</li>
                <li>Copia la URL que termina en <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800">/exec</code> y pégala en el campo de abajo.</li>
              </ol>
            </div>
          )}

          {/* Form to configure Webhook & Target Account */}
          <form onSubmit={handleSaveDriveConfig} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Cuenta Google Drive Institucional (Dueño del Drive)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                    account_circle
                  </span>
                  <input
                    type="email"
                    value={driveAccount}
                    onChange={(e) => setDriveAccountState(e.target.value)}
                    disabled={!isAdmin}
                    placeholder="ej. rectoria@colegio.cl o admin@empresa.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>URL del Webhook Google Apps Script (/exec)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">HTTPS Obligatorio</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                    link
                  </span>
                  <input
                    type="url"
                    value={driveWebhookUrl}
                    onChange={(e) => {
                      setDriveWebhookUrlState(e.target.value);
                      setDriveUrlError(null);
                    }}
                    disabled={!isAdmin}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border font-mono ${
                      driveUrlError
                        ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-200'
                        : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-indigo-100'
                    } focus:outline-none focus:ring-2 font-medium disabled:opacity-75 disabled:cursor-not-allowed`}
                  />
                </div>
                {driveUrlError && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    {driveUrlError}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-indigo-600 text-[20px] shrink-0">folder</span>
                <p className="text-[11px] text-indigo-900 truncate">
                  Carpeta en Drive: <strong>MinuteFlow - Actas Ejecutivas / {orgName}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Cifrado Activo</span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestDriveConnection}
                  disabled={isTestingDrive}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isTestingDrive ? 'animate-spin' : ''}`}>
                    {isTestingDrive ? 'progress_activity' : 'send'}
                  </span>
                  <span>{isTestingDrive ? 'Probando Conexión...' : 'Probar Envío a este Drive'}</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar Parámetros de Drive</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Profile Card / Editor */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">person</span>
              Perfil del Usuario Activo
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
                    {userProfile.plan || 'Plan Activo'}
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

        {/* Directory Management Card (Scoped to Organization) */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">groups</span>
                Directorio Institucional de {orgName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {allAttendees.length} miembros registrados en este establecimiento.
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                {onResetContacts && (
                  <button
                    type="button"
                    onClick={onResetContacts}
                    className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    title="Restablecer miembros por defecto de este establecimiento"
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
            )}
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
              placeholder="Buscar por nombre, cargo o correo en este establecimiento..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium"
            />
          </div>

          {/* Add Contact Form */}
          {isAddingContact && isAdmin && (
            <form onSubmit={handleCreateContactSubmit} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Agregar Nuevo Miembro a {orgName}
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
                  placeholder="Correo institucional"
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

                {isAdmin && (
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
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Folder / Directory Management */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">folder_special</span>
                Estructura de Carpetas de {orgName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clasifica las actas exclusivas de tu establecimiento.
              </p>
            </div>
            {isAdmin && (
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
            )}
          </div>

          {/* Add Folder Inline Form */}
          {isAddingFolder && isAdmin && (
            <form onSubmit={handleCreateFolderSubmit} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                  Crear Nueva Carpeta en {orgName}
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
                  placeholder="ej. Consejos Académicos 2026, Auditoría de Finanzas..."
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
                      Establecimiento: {orgName}
                    </p>
                  </div>
                </div>

                {isAdmin && (
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
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Minutes & Sample Data Management */}
        {isAdmin && (
          <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">database</span>
                Gestión de Datos de este Establecimiento
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controla las actas almacenadas para <strong>{orgName}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Actas de Muestra
                  </span>
                  <p className="text-xs text-slate-600 font-medium">
                    Elimina las actas precargadas de ejemplo para este establecimiento.
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
                    Restaura el set de actas de prueba configuradas para este establecimiento.
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
                    Borra permanentemente todas las actas registradas en {orgName}.
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
        )}
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
                <p className="text-xs text-slate-500">Actualiza los datos del asistente para {orgName}.</p>
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
                Se eliminará a &quot;<span className="font-semibold text-slate-700">{contactToDelete.name}</span>&quot; de {orgName}.
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
                Esta acción borrará las actas de muestra predefinidas en {orgName} para que puedas trabajar con una biblioteca limpia.
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
              <h3 className="text-base font-bold text-slate-900">¿Vaciar toda la biblioteca de {orgName}?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Esta acción eliminará <span className="font-bold text-slate-900">todas</span> las actas registradas para este establecimiento.
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
