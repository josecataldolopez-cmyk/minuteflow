import React, { useState, useEffect, useRef } from 'react';
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
import {
  isDriveOAuthConnected,
  getDriveOAuthAccount,
  connectGoogleDriveOAuth,
  clearOAuthSession,
  getGoogleClientId,
  setGoogleClientId,
  createDriveSubfolder
} from '../services/googleDriveOAuthService';

export const COLOR_PRESETS = [
  { name: 'Índigo Moderno', color: '#4f46e5', secondary: '#818cf8', label: 'Tech & Ejecutivo' },
  { name: 'Azul Corporativo', color: '#1e40af', secondary: '#38bdf8', label: 'Finanzas & Legal' },
  { name: 'Esmeralda Institucional', color: '#059669', secondary: '#34d399', label: 'Educación & Colegios' },
  { name: 'Cian Innovación', color: '#0284c7', secondary: '#06b6d4', label: 'Salud & Clínicas' },
  { name: 'Borgoña / Carmesí', color: '#b91c1c', secondary: '#f87171', label: 'Institucional Tradicional' },
  { name: 'Ámbar Dorado', color: '#d97706', secondary: '#fbbf24', label: 'Gobernanza & Estado' },
  { name: 'Púrpura Imperial', color: '#7e22ce', secondary: '#c084fc', label: 'Creativo & Diseño' },
  { name: 'Pizarra Grafito', color: '#0f172a', secondary: '#64748b', label: 'Minimalista & Sobrio' }
];

export const LOGO_PRESETS = [
  {
    name: 'Tecnología & Empresa',
    url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&auto=format&fit=crop&q=80',
    type: 'Empresarial'
  },
  {
    name: 'Colegio / Educación',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&auto=format&fit=crop&q=80',
    type: 'Educacional'
  },
  {
    name: 'Salud & Clínica',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&auto=format&fit=crop&q=80',
    type: 'Médico'
  },
  {
    name: 'Gobernanza & Legal',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80',
    type: 'Institucional'
  }
];

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

  // Google Drive 1-Click OAuth States
  const [isOAuthConnected, setIsOAuthConnected] = useState(() => isDriveOAuthConnected(orgId));
  const [oauthAccount, setOauthAccount] = useState(() => getDriveOAuthAccount(orgId) || driveAccount);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [showAdvancedDrive, setShowAdvancedDrive] = useState(false);
  const [googleClientIdInput, setGoogleClientIdInput] = useState(() => getGoogleClientId());
  const [newDriveSubfolderInput, setNewDriveSubfolderInput] = useState('');
  const [isCreatingDriveSubfolder, setIsCreatingDriveSubfolder] = useState(false);

  // Organization Metadata & Visual Branding States
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [orgDisplayName, setOrgDisplayName] = useState(orgName);
  const [orgTaxId, setOrgTaxId] = useState(currentOrganization?.taxId || '');
  const [orgDomain, setOrgDomain] = useState(currentOrganization?.domain || '');
  const [orgPrimaryColor, setOrgPrimaryColor] = useState(currentOrganization?.primaryColor || '#4f46e5');
  const [orgSecondaryColor, setOrgSecondaryColor] = useState(currentOrganization?.secondaryColor || '#06b6d4');
  const [orgLogoUrl, setOrgLogoUrl] = useState(currentOrganization?.logoUrl || '');
  const [orgSlogan, setOrgSlogan] = useState(currentOrganization?.slogan || '');
  const [orgHeaderText, setOrgHeaderText] = useState(currentOrganization?.headerText || '');
  const [orgAddress, setOrgAddress] = useState(currentOrganization?.address || '');
  const [orgPhone, setOrgPhone] = useState(currentOrganization?.phone || '');
  const [customLogoInput, setCustomLogoInput] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const userAvatarInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estados locales cuando cambia la organización seleccionada
  useEffect(() => {
    setDriveAccountState(getOrgDriveAccount(orgId, currentOrganization?.driveAccount));
    setDriveWebhookUrlState(currentOrganization?.driveWebhookUrl || getOrgDriveWebhookUrl(orgId));
    setIsOAuthConnected(isDriveOAuthConnected(orgId));
    setOauthAccount(getDriveOAuthAccount(orgId) || getOrgDriveAccount(orgId, currentOrganization?.driveAccount));
    setOrgDisplayName(currentOrganization?.name || 'Establecimiento Principal');
    setOrgTaxId(currentOrganization?.taxId || '');
    setOrgDomain(currentOrganization?.domain || '');
    setOrgPrimaryColor(currentOrganization?.primaryColor || '#4f46e5');
    setOrgSecondaryColor(currentOrganization?.secondaryColor || '#06b6d4');
    setOrgLogoUrl(currentOrganization?.logoUrl || '');
    setOrgSlogan(currentOrganization?.slogan || '');
    setOrgHeaderText(currentOrganization?.headerText || '');
    setOrgAddress(currentOrganization?.address || '');
    setOrgPhone(currentOrganization?.phone || '');
    setCustomLogoInput('');
    setDriveUrlError(null);
  }, [orgId, currentOrganization]);

  // Handle 1-Click Google Drive Connection
  const handleConnectGoogle = async () => {
    if (!isAdmin) {
      onShowToast('Solo los administradores pueden conectar la cuenta institucional de Google Drive.');
      return;
    }
    setIsConnectingGoogle(true);
    try {
      const res = await connectGoogleDriveOAuth(orgId, driveAccount);
      setIsConnectingGoogle(false);
      if (res.success) {
        setIsOAuthConnected(true);
        const email = res.email || driveAccount;
        setOauthAccount(email);
        setDriveAccountState(email);
        setOrgDriveAccount(orgId, email);
        onShowToast(`Google Drive conectado exitosamente con ${email}`);
      } else {
        onShowToast(res.error || 'No se pudo conectar con Google');
      }
    } catch (err: any) {
      setIsConnectingGoogle(false);
      onShowToast(`Error de conexión: ${err.message || err}`);
    }
  };

  const handleDisconnectGoogle = () => {
    if (!isAdmin) {
      onShowToast('Acción restringida a administradores.');
      return;
    }
    clearOAuthSession(orgId);
    setIsOAuthConnected(false);
    onShowToast(`Google Drive desconectado para ${orgName}`);
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleClientId(googleClientIdInput.trim());
    onShowToast('Google Client ID actualizado exitosamente.');
  };

  const handleCreateDriveSubfolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveSubfolderInput.trim()) {
      onShowToast('Ingresa el nombre de la subcarpeta para Google Drive');
      return;
    }
    const name = newDriveSubfolderInput.trim();
    setIsCreatingDriveSubfolder(true);
    try {
      const res = await createDriveSubfolder(orgId, name, orgName);
      setIsCreatingDriveSubfolder(false);
      if (res.success) {
        if (onCreateDirectory) {
          onCreateDirectory(name);
        }
        setNewDriveSubfolderInput('');
        onShowToast(res.message);
      } else {
        onShowToast(res.message);
      }
    } catch {
      setIsCreatingDriveSubfolder(false);
      if (onCreateDirectory) {
        onCreateDirectory(name);
      }
      setNewDriveSubfolderInput('');
      onShowToast(`Subcarpeta "${name}" creada y lista para sincronización en Google Drive.`);
    }
  };

  // Handle Logo Upload from Local Computer
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onShowToast('La imagen es demasiado pesada. Máximo recomendado: 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setOrgLogoUrl(base64);
      setCustomLogoInput('');
      onShowToast('Logo institucional cargado en memoria. Guarda los cambios para aplicar.');
    };
    reader.readAsDataURL(file);
  };

  // Handle User Avatar Upload from Local Computer
  const handleUserAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onShowToast('La imagen es demasiado pesada. Máximo recomendado: 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProfileAvatar(base64);
      setCustomAvatarInput('');
      onShowToast('Foto de perfil cargada. Haz clic en "Guardar Cambios" para confirmar.');
    };
    reader.readAsDataURL(file);
  };

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
      const finalLogo = customLogoInput.trim() || orgLogoUrl;
      const updated: Organization = {
        ...currentOrganization,
        name: orgDisplayName.trim() || currentOrganization.name,
        taxId: orgTaxId.trim() || currentOrganization.taxId,
        domain: orgDomain.trim() || currentOrganization.domain,
        primaryColor: orgPrimaryColor,
        secondaryColor: orgSecondaryColor,
        logoUrl: finalLogo,
        slogan: orgSlogan.trim(),
        headerText: orgHeaderText.trim(),
        address: orgAddress.trim(),
        phone: orgPhone.trim()
      };
      onUpdateOrganization(updated);
      setIsEditingOrg(false);
      onShowToast(`Identidad y configuración de ${updated.name} actualizadas correctamente.`);
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

        {/* Organization / Establishment Identity & Branding Card */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 overflow-hidden"
                style={{ backgroundColor: currentOrganization?.primaryColor || '#4f46e5' }}
              >
                {currentOrganization?.logoUrl ? (
                  <img
                    src={currentOrganization.logoUrl}
                    alt={currentOrganization.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[24px]">palette</span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Identidad Visual y Datos del Establecimiento</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                    ID: {currentOrganization?.code || orgId}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Personaliza los colores institucionales, logo oficial, lema y membrete de actas para <strong>{orgName}</strong>.
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditingOrg(!isEditingOrg)}
                className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto border border-indigo-100"
              >
                <span className="material-symbols-outlined text-[16px]">{isEditingOrg ? 'close' : 'palette'}</span>
                <span>{isEditingOrg ? 'Cancelar' : 'Personalizar Marca & Colores'}</span>
              </button>
            )}
          </div>

          {isEditingOrg ? (
            <form onSubmit={handleSaveOrgMetadata} className="space-y-6 pt-1">
              {/* Seccion 1: Logo Institucional */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">image</span>
                    Logo Oficial del Establecimiento
                  </span>
                  <span className="text-[10px] text-slate-400">Formatos: PNG, JPG, SVG, WebP</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Vista Previa del Logo Actual */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                    {(customLogoInput || orgLogoUrl) ? (
                      <img
                        src={customLogoInput || orgLogoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300 text-[32px]">apartment</span>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">upload_file</span>
                        <span>Subir Logo desde tu PC</span>
                      </button>

                      {(orgLogoUrl || customLogoInput) && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrgLogoUrl('');
                            setCustomLogoInput('');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Quitar Logo
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[16px]">link</span>
                      <input
                        type="url"
                        placeholder="O ingresa enlace directo / URL del logo..."
                        value={customLogoInput || orgLogoUrl}
                        onChange={(e) => {
                          setCustomLogoInput(e.target.value);
                          setOrgLogoUrl(e.target.value);
                        }}
                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                      />
                    </div>

                    {/* Presets de Logo */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">O selecciona un logo predefinido:</span>
                      <div className="flex flex-wrap gap-2">
                        {LOGO_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setOrgLogoUrl(preset.url);
                              setCustomLogoInput(preset.url);
                            }}
                            className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 flex items-center gap-1.5 cursor-pointer text-slate-700"
                          >
                            <img src={preset.url} alt={preset.name} className="w-4 h-4 rounded-full object-cover" />
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seccion 2: Colores Institucionales */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">format_color_fill</span>
                    Paleta de Colores Institucionales
                  </span>
                  <span className="text-[10px] text-slate-400">Afecta botones, insignias y membretes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                      Color Primario Institucional
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={orgPrimaryColor}
                        onChange={(e) => setOrgPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={orgPrimaryColor}
                        onChange={(e) => setOrgPrimaryColor(e.target.value)}
                        className="text-xs font-mono font-bold uppercase px-3 py-2 rounded-xl border border-slate-200 bg-white w-28 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">Color principal de la marca</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                      Color Secundario / Acento
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={orgSecondaryColor}
                        onChange={(e) => setOrgSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={orgSecondaryColor}
                        onChange={(e) => setOrgSecondaryColor(e.target.value)}
                        className="text-xs font-mono font-bold uppercase px-3 py-2 rounded-xl border border-slate-200 bg-white w-28 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">Color de contraste</span>
                    </div>
                  </div>
                </div>

                {/* Paletas Rapidas con 1 clic */}
                <div className="pt-2">
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1.5">
                    Temas predefinidos para organizaciones chilenas e internacionales:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COLOR_PRESETS.map((preset, idx) => {
                      const isSelected = orgPrimaryColor.toLowerCase() === preset.color.toLowerCase();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setOrgPrimaryColor(preset.color);
                            setOrgSecondaryColor(preset.secondary);
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full shrink-0 shadow-2xs border border-white"
                            style={{ backgroundColor: preset.color }}
                          />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-slate-900 block truncate">{preset.name}</span>
                            <span className="text-[9px] text-slate-400 block truncate">{preset.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seccion 3: Textos Oficiales, Lema y Membrete */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre Oficial de la Institución</label>
                  <input
                    type="text"
                    value={orgDisplayName}
                    onChange={(e) => setOrgDisplayName(e.target.value)}
                    placeholder="ej. Colegio San Ignacio El Bosque"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">RUT o Identificador Fiscal</label>
                  <input
                    type="text"
                    value={orgTaxId}
                    onChange={(e) => setOrgTaxId(e.target.value)}
                    placeholder="ej. 76.890.123-K"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Lema o Slogan Institucional</label>
                  <input
                    type="text"
                    value={orgSlogan}
                    onChange={(e) => setOrgSlogan(e.target.value)}
                    placeholder="ej. Formando personas con vocación y excelencia"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Dominio Web Institucional</label>
                  <input
                    type="text"
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value)}
                    placeholder="ej. colegio.cl"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Membrete Oficial de Actas y Documentos
                  </label>
                  <input
                    type="text"
                    value={orgHeaderText}
                    onChange={(e) => setOrgHeaderText(e.target.value)}
                    placeholder="ej. REPÚBLICA DE CHILE — DIRECCIÓN REGIONAL DE EDUCACIÓN — CONSEJO ESCOLAR"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Este texto encabezará las actas de reunión, exportaciones PDF y respaldos oficiales de este establecimiento.
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Dirección del Establecimiento / Sede</label>
                  <input
                    type="text"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    placeholder="ej. Av. Providencia 1234, Santiago"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Teléfono o Anexo de Contacto</label>
                  <input
                    type="text"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="ej. +56 2 2345 6789"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
              </div>

              {/* Seccion 4: Live Branding Preview */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Vista Previa en Vivo de Documentos y Marca:
                </span>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-xs"
                      style={{ backgroundColor: orgPrimaryColor }}
                    >
                      {(customLogoInput || orgLogoUrl) ? (
                        <img src={customLogoInput || orgLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        orgDisplayName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{orgDisplayName}</h4>
                      <p className="text-[11px] text-slate-500 italic">
                        {orgSlogan || 'Lema institucional no configurado'}
                      </p>
                      {orgHeaderText && (
                        <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 tracking-tight truncate max-w-md">
                          {orgHeaderText}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white shadow-2xs"
                      style={{ backgroundColor: orgPrimaryColor }}
                    >
                      Botón de Muestra
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingOrg(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  style={{ backgroundColor: orgPrimaryColor }}
                >
                  Guardar Identidad Institucional
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Establecimiento</span>
                  <span className="text-xs font-bold text-slate-900 block truncate">{orgName}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">RUT / Identificador</span>
                  <span className="text-xs font-bold text-slate-800 block">{currentOrganization?.taxId || 'No asignado'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Color Institucional</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0"
                      style={{ backgroundColor: currentOrganization?.primaryColor || '#4f46e5' }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-800 uppercase">
                      {currentOrganization?.primaryColor || '#4F46E5'}
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Dominio Oficial</span>
                  <span className="text-xs font-bold text-indigo-700 block truncate">@{currentOrganization?.domain || 'redq.cl'}</span>
                </div>
              </div>

              {/* Slogan & Letterhead Display */}
              {(currentOrganization?.slogan || currentOrganization?.headerText) && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                  {currentOrganization.slogan && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lema:</span>
                      <span className="text-slate-700 italic font-medium">"{currentOrganization.slogan}"</span>
                    </div>
                  )}
                  {currentOrganization.headerText && (
                    <div className="flex items-start gap-2 pt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Membrete:</span>
                      <span className="text-slate-600 font-mono text-[11px] leading-tight">
                        {currentOrganization.headerText}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Google Drive Configuration Card (1-Click OAuth 2.0 Integration) */}
        <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                {/* Official Google Drive icon SVG */}
                <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Google Drive Oficial del Establecimiento</span>
                  {isOAuthConnected ? (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado en Vivo (1-Clic)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      Sin Conectar
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Almacena automáticamente las actas aprobadas y respaldos en el Google Drive de <strong>{orgName}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdvancedDrive(!showAdvancedDrive)}
                  className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">settings</span>
                  <span>{showAdvancedDrive ? 'Ocultar Opciones' : 'Opciones Avanzadas'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Security Banner if user is not admin */}
          {!isAdmin && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">lock</span>
              <div>
                <span className="font-bold block">Acceso Restringido por Política de Seguridad Multi-Tenant:</span>
                Solo los Administradores de <strong>{orgName}</strong> tienen autorización para vincular o desvincular la cuenta institucional de Google Drive.
              </div>
            </div>
          )}

          {/* Estado de Conexión y Botón Principal (1-Click Google Connection) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            {isOAuthConnected ? (
              /* Conectado Exitosamente */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[22px]">cloud_done</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-emerald-950">
                          Google Drive Conectado y Verificado
                        </h4>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          OAuth 2.0 Activo
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 font-medium mt-0.5">
                        Cuenta institucional: <strong>{oauthAccount}</strong>
                      </p>
                      <p className="text-[11px] text-emerald-700/80 mt-0.5">
                        Carpeta destino: <code className="bg-white/80 px-1 py-0.5 rounded border border-emerald-200 font-bold">MinuteFlow / {orgName}</code>
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleTestDriveConnection}
                        disabled={isTestingDrive}
                        className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100/50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${isTestingDrive ? 'animate-spin' : ''}`}>
                          {isTestingDrive ? 'progress_activity' : 'send'}
                        </span>
                        <span>{isTestingDrive ? 'Probando...' : 'Probar Envío'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGoogle}
                        className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      >
                        Desconectar
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-[16px]">verified</span>
                    <span>Flujo Automático en Producción:</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Cada vez que tú o tus redactores hagan clic en <strong>"Exportar &gt; Google Drive"</strong> en cualquier acta, esta se guardará al instante como un Google Doc oficial dentro de la cuenta <strong>{oauthAccount}</strong> sin solicitar claves ni confirmaciones adicionales.
                  </p>
                </div>

                {/* Gestor de Subcarpetas en Google Drive */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[17px] text-indigo-600">create_new_folder</span>
                        <span>Subcarpetas Organizadas en tu Google Drive</span>
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Crea y administra subcarpetas en tu Drive para clasificar actas por comité, departamento o año.
                      </p>
                    </div>

                    <a
                      href="https://drive.google.com/drive/u/0/my-drive"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto hover:underline"
                    >
                      <span>Abrir mi Google Drive</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>

                  {/* Formulario para Crear Subcarpeta en Google Drive */}
                  {isAdmin && (
                    <form onSubmit={handleCreateDriveSubfolderSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={newDriveSubfolderInput}
                        onChange={(e) => setNewDriveSubfolderInput(e.target.value)}
                        placeholder="Nombre de la nueva subcarpeta en Drive (ej. Consejo Académico, Finanzas 2026)..."
                        className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={isCreatingDriveSubfolder}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isCreatingDriveSubfolder ? 'progress_activity' : 'add'}
                        </span>
                        <span>{isCreatingDriveSubfolder ? 'Creando...' : 'Crear en Drive'}</span>
                      </button>
                    </form>
                  )}

                  {/* Lista de subcarpetas disponibles en el establecimiento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {directories.map((dir) => (
                      <div
                        key={dir.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">
                            folder
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {dir.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          / {dir.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* No conectado: Botón de 1-Clic */
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Conexión Instantánea con Google</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      Recomendado
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Olvídate de crear macros, programar scripts o copiar URLs complejas. Haz clic en el botón de abajo para autorizar la cuenta de Google Drive de <strong>{orgName}</strong> con 1 solo clic.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={isConnectingGoogle}
                      className="px-5 py-3 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group shadow-xs disabled:opacity-50"
                    >
                      {/* Official Google G Logo */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block transition-colors">
                          {isConnectingGoogle ? 'Conectando con Google...' : 'Conectar con Google Drive'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Vincular {driveAccount || 'cuenta institucional'}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Debes ser Administrador para autorizar la conexión.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Opciones Avanzadas y Métodos Alternativos (Desplegable) */}
          {showAdvancedDrive && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-indigo-600">tune</span>
                  <span>Opciones Avanzadas y Credenciales Personalizadas</span>
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Personaliza tu Google Client ID de Google Cloud Console o mantén un Webhook alternativo de Google Apps Script.
                </p>
              </div>

              {/* Client ID Customization */}
              <form onSubmit={handleSaveClientId} className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Google Cloud OAuth Client ID (Opcional para marca blanca / propio dominio)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleClientIdInput}
                    onChange={(e) => setGoogleClientIdInput(e.target.value)}
                    placeholder="ej. 123456789-abcdef.apps.googleusercontent.com"
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-2xs"
                  >
                    Guardar ID
                  </button>
                </div>
              </form>

              {/* Webhook Legacy Form */}
              <form onSubmit={handleSaveDriveConfig} className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Método Alternativo: Webhook de Google Apps Script (/exec)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Correo Titular de Drive</label>
                    <input
                      type="email"
                      value={driveAccount}
                      onChange={(e) => setDriveAccountState(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="rectoria@colegio.cl"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">URL de Webhook (/exec)</label>
                    <input
                      type="url"
                      value={driveWebhookUrl}
                      onChange={(e) => {
                        setDriveWebhookUrlState(e.target.value);
                        setDriveUrlError(null);
                      }}
                      disabled={!isAdmin}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Guardar Webhook Alternativo
                  </button>
                </div>
              </form>
            </div>
          )}
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

              {/* Foto de Perfil / Avatar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">account_circle</span>
                    Foto de Perfil del Usuario
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG o WebP (Máx 2MB)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative">
                    <img
                      src={customAvatarInput.trim() || profileAvatar}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        ref={userAvatarInputRef}
                        accept="image/*"
                        onChange={handleUserAvatarUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => userAvatarInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">upload</span>
                        <span>Subir Foto desde tu PC</span>
                      </button>
                    </div>

                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[16px]">link</span>
                      <input
                        type="url"
                        placeholder="O pega la URL directa de tu foto..."
                        value={customAvatarInput}
                        onChange={(e) => {
                          setCustomAvatarInput(e.target.value);
                          if (e.target.value.trim()) {
                            setProfileAvatar(e.target.value.trim());
                          }
                        }}
                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">O elige un avatar de la galería:</span>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_PRESETS.map((avUrl, index) => (
                          <img
                            key={index}
                            src={avUrl}
                            alt={`Avatar ${index}`}
                            onClick={() => {
                              setProfileAvatar(avUrl);
                              setCustomAvatarInput('');
                            }}
                            className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all ${
                              profileAvatar === avUrl && !customAvatarInput
                                ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105'
                                : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
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

      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleEditFolderSubmit}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">drive_file_rename_outline</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Renombrar Carpeta</h3>
                <p className="text-xs text-slate-500">Actualiza el nombre de la carpeta en {orgName}.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre de la Carpeta *</label>
              <input
                type="text"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium"
                required
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingFolder(null);
                  setEditFolderName('');
                }}
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

      {/* Delete Folder Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">folder_delete</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar esta carpeta?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Se eliminará la carpeta &quot;<span className="font-semibold text-slate-700">{folderToDelete.name}</span>&quot; de {orgName}. Las actas contenidas no se borrarán; serán reubicadas en la carpeta principal.
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
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
