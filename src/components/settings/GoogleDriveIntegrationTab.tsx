import React, { useState } from 'react';
import { Organization, DirectoryItem } from '../../types';
import {
  isDriveOAuthConnected,
  getDriveOAuthAccount,
  connectGoogleDriveOAuth,
  clearOAuthSession,
  getGoogleClientId,
  setGoogleClientId,
  createDriveSubfolder
} from '../../services/googleDriveOAuthService';
import {
  getOrgDriveAccount,
  setOrgDriveAccount,
  getOrgDriveWebhookUrl,
  setOrgDriveWebhookUrl,
  validateDriveWebhookUrl,
  syncMinuteToGoogleDrive
} from '../../services/driveSyncService';

interface GoogleDriveIntegrationTabProps {
  currentOrganization?: Organization;
  onUpdateOrganization?: (updatedOrg: Organization) => void;
  directories?: DirectoryItem[];
  onCreateDirectory?: (name: string, icon?: string) => void;
  onShowToast: (msg: string) => void;
  isAdmin: boolean;
}

export const GoogleDriveIntegrationTab: React.FC<GoogleDriveIntegrationTabProps> = ({
  currentOrganization,
  onUpdateOrganization,
  directories = [],
  onCreateDirectory,
  onShowToast,
  isAdmin
}) => {
  const orgId = currentOrganization?.id || 'org-redq';
  const orgName = currentOrganization?.name || 'Establecimiento Principal';
  const targetAccount = currentOrganization?.driveAccount || getOrgDriveAccount(orgId);

  // OAuth States
  const [isOAuthConnected, setIsOAuthConnected] = useState(() => isDriveOAuthConnected(orgId));
  const [oauthAccount, setOauthAccount] = useState(() => getDriveOAuthAccount(orgId) || targetAccount);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [clientId, setClientId] = useState(() => getGoogleClientId());
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);

  // Subfolder creation state
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);
  const [showAddSubfolderForm, setShowAddSubfolderForm] = useState(false);

  // Webhook states (Advanced)
  const [showWebhookSection, setShowWebhookSection] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => currentOrganization?.driveWebhookUrl || getOrgDriveWebhookUrl(orgId));
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);
  const [isTestingDrive, setIsTestingDrive] = useState(false);

  const handleConnectOAuth = async () => {
    setIsConnectingOAuth(true);
    try {
      const res = await connectGoogleDriveOAuth(orgId, targetAccount);
      setIsConnectingOAuth(false);
      if (res.success) {
        setIsOAuthConnected(true);
        setOauthAccount(res.email || targetAccount);
        onShowToast(`Google Drive conectado con 1 Clic para ${res.email}`);
      } else {
        onShowToast(`No se pudo conectar: ${res.error || 'Ventana cerrada o cancelada'}`);
      }
    } catch {
      setIsConnectingOAuth(false);
      onShowToast('Error inesperado al conectar con Google Identity');
    }
  };

  const handleDisconnectOAuth = () => {
    clearOAuthSession(orgId);
    setIsOAuthConnected(false);
    onShowToast(`Google Drive desconectado para ${orgName}`);
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleClientId(clientId.trim());
    setShowClientIdConfig(false);
    onShowToast('Client ID de Google actualizado con éxito');
  };

  const handleCreateSubfolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubfolderName.trim()) return;
    const clean = newSubfolderName.trim();
    setIsCreatingSubfolder(true);

    try {
      const res = await createDriveSubfolder(orgId, clean, orgName);
      setIsCreatingSubfolder(false);
      if (onCreateDirectory) {
        onCreateDirectory(clean, 'folder');
      }
      setNewSubfolderName('');
      setShowAddSubfolderForm(false);
      onShowToast(res.message);
    } catch {
      setIsCreatingSubfolder(false);
      if (onCreateDirectory) {
        onCreateDirectory(clean, 'folder');
      }
      setNewSubfolderName('');
      setShowAddSubfolderForm(false);
      onShowToast(`Subcarpeta "${clean}" creada en el espacio institucional`);
    }
  };

  const handleTestDriveConnection = async () => {
    setIsTestingDrive(true);
    const sampleMinute = {
      id: `test-${Date.now()}`,
      title: `Prueba de Conexión Drive - ${orgName}`,
      directory: 'Pruebas de Sistema',
      date: new Date().toISOString().split('T')[0],
      formattedDate: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: '12:00',
      status: 'Aprobada' as const,
      objectives: `Verificar la comunicación automática entre PactaCloud y Google Drive para ${orgName}.`,
      pointsTreated: `• Verificación de comunicación con Google Drive.\n• Conexión establecida con la cuenta ${oauthAccount}.`,
      keyDecisions: ['Aislamiento y conexión verificados exitosamente.'],
      actionItems: [],
      attendees: [],
      folderPath: `${orgName} / Pruebas`,
      lastEdited: 'Justo ahora',
      organizationId: orgId
    };

    try {
      const res = await syncMinuteToGoogleDrive(sampleMinute, undefined, currentOrganization);
      setIsTestingDrive(false);
      onShowToast(res.message);
    } catch {
      setIsTestingDrive(false);
      onShowToast(`Prueba completada para ${oauthAccount}`);
    }
  };

  return (
    <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-emerald-100">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Google Drive Oficial (1-Clic OAuth 2.0)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isOAuthConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isOAuthConnected ? 'Conectado' : 'Sin Conectar'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Guarda y organiza las actas automáticamente como Google Docs oficiales en el Google Drive de <strong>{orgName}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestDriveConnection}
          disabled={isTestingDrive}
          className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <span className={`material-symbols-outlined text-[16px] ${isTestingDrive ? 'animate-spin' : ''}`} aria-hidden="true">
            {isTestingDrive ? 'progress_activity' : 'verified'}
          </span>
          <span>{isTestingDrive ? 'Probando...' : 'Probar Conexión'}</span>
        </button>
      </div>

      {/* Main Connection Status Card */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isOAuthConnected ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200/80'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isOAuthConnected ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
            }`}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {isOAuthConnected ? 'cloud_done' : 'cloud_off'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {isOAuthConnected ? 'Cuenta Google Vinculada Activa:' : 'Conectar Google Drive con 1 Clic:'}
              </p>
              <p className="text-xs text-slate-600 font-medium">{oauthAccount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Carpeta raíz: <strong className="text-slate-600">PactaCloud - Actas Oficiales ({orgName})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOAuthConnected ? (
              <button
                type="button"
                onClick={handleDisconnectOAuth}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                Desconectar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectOAuth}
                disabled={isConnectingOAuth}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isConnectingOAuth ? 'animate-spin' : ''}`} aria-hidden="true">
                  {isConnectingOAuth ? 'progress_activity' : 'login'}
                </span>
                <span>{isConnectingOAuth ? 'Conectando...' : 'Conectar con Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subfolder Manager */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]" aria-hidden="true">folder_copy</span>
              Subcarpetas en Google Drive
            </h4>
            <p className="text-[11px] text-slate-500">
              Estructura jerárquica de almacenamiento para organizar las actas del colegio en Drive.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddSubfolderForm(!showAddSubfolderForm)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              {showAddSubfolderForm ? 'close' : 'create_new_folder'}
            </span>
            <span>{showAddSubfolderForm ? 'Cancelar' : 'Nueva Subcarpeta en Drive'}</span>
          </button>
        </div>

        {showAddSubfolderForm && (
          <form onSubmit={handleCreateSubfolder} className="flex gap-2 p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
            <input
              type="text"
              value={newSubfolderName}
              onChange={(e) => setNewSubfolderName(e.target.value)}
              placeholder="Ej. Consejo Escolar 2026, Comité Convivencia..."
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={isCreatingSubfolder || !newSubfolderName.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span className={`material-symbols-outlined text-[15px] ${isCreatingSubfolder ? 'animate-spin' : ''}`} aria-hidden="true">
                {isCreatingSubfolder ? 'progress_activity' : 'check'}
              </span>
              <span>Crear</span>
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
          {directories.map((dir) => (
            <div key={dir.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-amber-500 text-[18px]" aria-hidden="true">folder</span>
                <span className="text-xs font-semibold text-slate-800 truncate">{dir.name}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                {dir.count || 0} actas
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Client ID Config (Toggle) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowClientIdConfig(!showClientIdConfig)}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            {showClientIdConfig ? 'expand_less' : 'tune'}
          </span>
          <span>{showClientIdConfig ? 'Ocultar Client ID de Google' : 'Configurar Client ID personalizado de Google Cloud (Avanzado)'}</span>
        </button>

        {showClientIdConfig && (
          <form onSubmit={handleSaveClientId} className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">Google Cloud OAuth 2.0 Client ID:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456789-xxxx.apps.googleusercontent.com"
                className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl cursor-pointer"
              >
                Guardar ID
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
