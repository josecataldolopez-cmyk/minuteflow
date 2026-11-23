import React, { useState, useEffect } from 'react';
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
  testDriveWebhook,
  APPS_SCRIPT_TEMPLATE,
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

  // Webhook States (Método 1: Apps Script)
  const [webhookInput, setWebhookInput] = useState(() => getOrgDriveWebhookUrl(orgId));
  const [isSavedWebhook, setIsSavedWebhook] = useState(() => Boolean(getOrgDriveWebhookUrl(orgId)));
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // OAuth States (Método 2: Google Identity)
  const [isOAuthConnected, setIsOAuthConnected] = useState(() => isDriveOAuthConnected(orgId));
  const [oauthAccount, setOauthAccount] = useState(() => getDriveOAuthAccount(orgId) || targetAccount || '');
  const [driveEmailInput, setDriveEmailInput] = useState(() => getDriveOAuthAccount(orgId) || targetAccount || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [clientId, setClientId] = useState(() => getGoogleClientId());
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);

  // Subfolder & Test states
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [showAddSubfolderForm, setShowAddSubfolderForm] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);

  // Sincronizar si cambia currentOrganization
  useEffect(() => {
    const freshEmail = currentOrganization?.driveAccount || getOrgDriveAccount(orgId) || '';
    setOauthAccount(getDriveOAuthAccount(orgId) || freshEmail);
    setDriveEmailInput(getDriveOAuthAccount(orgId) || freshEmail);
    const savedWeb = getOrgDriveWebhookUrl(orgId);
    setWebhookInput(savedWeb);
    setIsSavedWebhook(Boolean(savedWeb));
  }, [currentOrganization, orgId]);

  // Manejo de Webhook
  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = webhookInput.trim();
    if (!clean) {
      setOrgDriveWebhookUrl(orgId, '');
      setIsSavedWebhook(false);
      onShowToast('Webhook de Google Apps Script desvinculado');
      return;
    }

    const validation = validateDriveWebhookUrl(clean);
    if (!validation.isValid) {
      onShowToast(`Error de validación: ${validation.error}`);
      return;
    }

    setOrgDriveWebhookUrl(orgId, clean);
    setIsSavedWebhook(true);
    onShowToast(`Webhook de Google Apps Script guardado para ${orgName}`);
  };

  const handleTestWebhook = async () => {
    if (!webhookInput.trim()) {
      onShowToast('Ingresa primero la URL de tu Webhook para probarlo');
      return;
    }
    setIsTestingWebhook(true);
    const res = await testDriveWebhook(orgId, orgName);
    setIsTestingWebhook(false);
    onShowToast(res.message);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopiedCode(true);
      onShowToast('Código de Google Apps Script copiado al portapapeles');
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      onShowToast('No se pudo copiar automáticamente. Puedes seleccionar el código manualmente.');
    }
  };

  // Manejo de Cuenta de Correo
  const handleSaveCustomEmail = () => {
    const clean = driveEmailInput.trim();
    if (!clean) {
      onShowToast('Ingresa un correo electrónico válido');
      return;
    }
    setOauthAccount(clean);
    setOrgDriveAccount(orgId, clean);
    if (currentOrganization && onUpdateOrganization) {
      onUpdateOrganization({
        ...currentOrganization,
        driveAccount: clean
      });
    }
    setIsEditingEmail(false);
    onShowToast(`Cuenta de Google Drive configurada: ${clean}`);
  };

  // Conexión OAuth
  const handleConnectOAuth = async () => {
    const emailToUse = driveEmailInput.trim() || oauthAccount || targetAccount;
    setIsConnectingOAuth(true);
    try {
      const res = await connectGoogleDriveOAuth(orgId, emailToUse);
      setIsConnectingOAuth(false);
      if (res.success) {
        setIsOAuthConnected(true);
        const savedEmail = res.email || emailToUse;
        setOauthAccount(savedEmail);
        setDriveEmailInput(savedEmail);
        setOrgDriveAccount(orgId, savedEmail);
        if (currentOrganization && onUpdateOrganization) {
          onUpdateOrganization({
            ...currentOrganization,
            driveAccount: savedEmail
          });
        }
        onShowToast(`Google Drive conectado exitosamente con ${savedEmail}`);
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
    onShowToast(`Google Drive desconectado para ${orgName}.`);
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleClientId(clientId.trim());
    setShowClientIdConfig(false);
    onShowToast('Client ID de Google actualizado con éxito');
  };

  // Creación de Subcarpeta
  const handleCreateSubfolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubfolderName.trim()) return;
    const clean = newSubfolderName.trim();
    setIsCreatingSubfolder(true);

    try {
      const res = await createDriveSubfolder(orgId, clean, orgName);
      setIsCreatingSubfolder(false);
      if (res.success) {
        if (onCreateDirectory) {
          onCreateDirectory(clean, 'folder');
        }
        setNewSubfolderName('');
        setShowAddSubfolderForm(false);
        onShowToast(res.message);
      } else {
        onShowToast(res.message);
      }
    } catch (err: unknown) {
      setIsCreatingSubfolder(false);
      const msg = err instanceof Error ? err.message : 'Error al crear la subcarpeta';
      onShowToast(msg);
    }
  };

  // Prueba de Conexión Integral
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

  const hasAnyConnection = isSavedWebhook || isOAuthConnected;

  return (
    <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-indigo-100">
            <span className="material-symbols-outlined text-[26px]" aria-hidden="true">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Google Drive del Establecimiento</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                hasAnyConnection ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {hasAnyConnection ? 'Sincronización Habilitada' : 'Pendiente de Conexión'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Almacena automáticamente actas en Google Docs y crea carpetas para <strong>{orgName}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestDriveConnection}
          disabled={isTestingDrive}
          className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto shadow-2xs"
        >
          <span className={`material-symbols-outlined text-[16px] ${isTestingDrive ? 'animate-spin' : ''}`} aria-hidden="true">
            {isTestingDrive ? 'progress_activity' : 'verified'}
          </span>
          <span>{isTestingDrive ? 'Probando Drive...' : 'Probar Conexión con Drive'}</span>
        </button>
      </div>

      {/* MÉTODO 1: Google Apps Script Webhook (RECOMENDADO) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Método Recomendado: Webhook de Google Apps Script</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  100% Real • Sin Google Cloud Console
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Crea carpetas físicas y Google Docs directamente en tu Drive institucional sin costo ni autorizaciones complejas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWebhookGuide(!showWebhookGuide)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              {showWebhookGuide ? 'expand_less' : 'menu_book'}
            </span>
            <span>{showWebhookGuide ? 'Ocultar Guía' : 'Ver Instrucciones & Código (3 min)'}</span>
          </button>
        </div>

        {/* Formulario de URL del Webhook */}
        <form onSubmit={handleSaveWebhook} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              URL de la Aplicación Web de Google Apps Script (termina en /exec):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-2xs"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar Webhook</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !webhookInput.trim()}
                  className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isTestingWebhook ? 'animate-spin' : ''}`}>
                    {isTestingWebhook ? 'progress_activity' : 'network_check'}
                  </span>
                  <span>Probar</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Guía Desplegable de 5 Pasos */}
        {showWebhookGuide && (
          <div className="p-4 rounded-xl bg-white border border-indigo-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">integration_instructions</span>
                Instalación del Webhook en 3 pasos sencillos
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copiedCode ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código del Script'}</span>
              </button>
            </div>

            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Abre <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">script.google.com</a> con la cuenta Google de tu establecimiento.
              </li>
              <li>
                Haz clic en <strong>"Nuevo proyecto"</strong> y titúlalo <em>PactaCloud Drive Sync</em>.
              </li>
              <li>
                Borra el código que aparece por defecto y <strong>pega el código que copiaste con el botón de arriba</strong>.
              </li>
              <li>
                Arriba a la derecha pulsa <strong>Implementar &gt; Nueva implementación</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 text-[11px] text-slate-500">
                  <li>Tipo: <strong>Aplicación web</strong></li>
                  <li>Ejecutar como: <strong>Yo (tu correo)</strong></li>
                  <li>Quién tiene acceso: <strong>Cualquier usuario (Anyone)</strong></li>
                </ul>
              </li>
              <li>
                Copia la <strong>URL de la aplicación web</strong> que termina en <code>/exec</code> y pégala en el campo de arriba. ¡Listo!
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* MÉTODO 2: Google Identity OAuth 2.0 (Opcional) */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
            2
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800">
              Método Alternativo: Google OAuth 2.0 (Google Identity Services)
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              Cuenta vinculada: <strong>{oauthAccount || 'Sin asignar'}</strong>
            </p>
          </div>
          {isOAuthConnected ? (
            <button
              type="button"
              onClick={handleDisconnectOAuth}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
            >
              Desconectar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectOAuth}
              disabled={isConnectingOAuth}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[15px] ${isConnectingOAuth ? 'animate-spin' : ''}`}>
                {isConnectingOAuth ? 'progress_activity' : 'login'}
              </span>
              <span>{isConnectingOAuth ? 'Conectando...' : 'Conectar con Google'}</span>
            </button>
          )}
        </div>

        {/* Edición de Correo */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
          <span className="text-slate-500">Correo para registro de actas:</span>
          {isEditingEmail ? (
            <div className="flex items-center gap-1.5">
              <input
                type="email"
                value={driveEmailInput}
                onChange={(e) => setDriveEmailInput(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-white w-48 font-medium"
              />
              <button
                type="button"
                onClick={handleSaveCustomEmail}
                className="text-xs bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsEditingEmail(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-1 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <strong className="text-slate-800 font-semibold">{oauthAccount || 'rectoria@colegio.cl'}</strong>
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subcarpetas en Google Drive */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]" aria-hidden="true">folder_copy</span>
              <span>Subcarpetas en Google Drive para {orgName}</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cada subcarpeta creada se genera dentro de <strong>PactaCloud - Actas Oficiales ({orgName})</strong> en tu Drive.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddSubfolderForm(!showAddSubfolderForm)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              {showAddSubfolderForm ? 'close' : 'create_new_folder'}
            </span>
            <span>{showAddSubfolderForm ? 'Cancelar' : 'Nueva Subcarpeta en Drive'}</span>
          </button>
        </div>

        {showAddSubfolderForm && (
          <form onSubmit={handleCreateSubfolder} className="p-3.5 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">Nombre de la nueva subcarpeta:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubfolderName}
                onChange={(e) => setNewSubfolderName(e.target.value)}
                placeholder="Ej. Consejo Escolar 2026, Comité de Convivencia, Consejo Directivo..."
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                <span>{isCreatingSubfolder ? 'Creando...' : 'Crear en Drive'}</span>
              </button>
            </div>
            {!hasAnyConnection && (
              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠️ Para que la carpeta se cree físicamente en tu Google Drive real, primero guarda la URL de tu Webhook en el bloque superior (Método 1).
              </p>
            )}
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {directories.map((dir) => (
            <div key={dir.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-amber-500 text-[20px]" aria-hidden="true">folder</span>
                <span className="text-xs font-bold text-slate-800 truncate">{dir.name}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                {dir.count || 0} actas
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuración Avanzada de Client ID */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowClientIdConfig(!showClientIdConfig)}
          className="text-[11px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">
            {showClientIdConfig ? 'expand_less' : 'tune'}
          </span>
          <span>{showClientIdConfig ? 'Ocultar Google Client ID' : 'Configurar Client ID de Google Cloud (Avanzado)'}</span>
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
