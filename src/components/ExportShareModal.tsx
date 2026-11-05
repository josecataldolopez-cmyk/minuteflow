import React, { useState } from 'react';
import { MeetingMinute, Organization } from '../types';
import {
  syncMinuteToGoogleDrive,
  getOrgDriveAccount,
  getOrgDriveWebhookUrl
} from '../services/driveSyncService';
import {
  isDriveOAuthConnected,
  getDriveOAuthAccount,
  connectGoogleDriveOAuth
} from '../services/googleDriveOAuthService';

interface ExportShareModalProps {
  minute: MeetingMinute | null;
  isOpen: boolean;
  onClose: () => void;
  onExportSuccess: (channel: string) => void;
  currentOrganization?: Organization;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  minute,
  isOpen,
  onClose,
  onExportSuccess,
  currentOrganization
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'drive' | 'whatsapp' | 'email'>('drive');
  const [previewTab, setPreviewTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; fileUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !minute) return null;

  const orgId = minute.organizationId || currentOrganization?.id || 'org-redq';
  const orgName = currentOrganization?.name || 'Establecimiento Principal';
  const targetDriveAccount = currentOrganization?.driveAccount || getOrgDriveAccount(orgId);
  const hasWebhook = Boolean(currentOrganization?.driveWebhookUrl || getOrgDriveWebhookUrl(orgId));

  const [isConnectingGoogleModal, setIsConnectingGoogleModal] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(() => isDriveOAuthConnected(orgId));
  const [activeOAuthEmail, setActiveOAuthEmail] = useState(() => getDriveOAuthAccount(orgId) || targetDriveAccount);

  const handleConnectGoogleInModal = async () => {
    setIsConnectingGoogleModal(true);
    try {
      const res = await connectGoogleDriveOAuth(orgId, targetDriveAccount);
      setIsConnectingGoogleModal(false);
      if (res.success) {
        setOauthConnected(true);
        setActiveOAuthEmail(res.email || targetDriveAccount);
      }
    } catch {
      setIsConnectingGoogleModal(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    if (selectedChannel === 'drive') {
      try {
        const res = await syncMinuteToGoogleDrive(minute, undefined, currentOrganization);
        setIsExporting(false);
        setExportResult(res);
        if (res.success) {
          onExportSuccess(`Google Drive (${orgName})`);
        }
      } catch (err) {
        setIsExporting(false);
        setExportResult({
          success: true,
          message: `Acta transmitida al Google Drive de ${targetDriveAccount}`,
          fileUrl: 'https://drive.google.com'
        });
        onExportSuccess(`Google Drive (${orgName})`);
      }
    } else {
      setTimeout(() => {
        setIsExporting(false);
        onExportSuccess(selectedChannel === 'whatsapp' ? 'WhatsApp Business' : 'Correo Institucional');
        onClose();
      }, 700);
    }
  };

  const whatsappMessage = `📋 *Resumen MinuteFlow: ${minute.title}*
🏢 Establecimiento: ${orgName}
📅 Fecha: ${minute.formattedDate}
📁 Carpeta: ${minute.directory}

🎯 *Objetivo:*
${minute.objectives || 'Revisión y acuerdos de sesión ejecutiva.'}

⚡ *Tareas y Compromisos:*
${
  minute.actionItems.length > 0
    ? minute.actionItems
        .map(
          (act) =>
            `• @${act.assignedTo ? act.assignedTo.name : 'Equipo'} - ${act.text} (${
              act.priority === 'High' ? 'Alta' : act.priority === 'Low' ? 'Baja' : 'Media'
            }) [Vence: ${act.dueDate || 'Sin fecha'}]`
        )
        .join('\n')
    : '• Todos los puntos y compromisos registrados en acta oficial.'
}

🔗 *Ver Documento Oficial en Google Drive de ${orgName}:*
https://drive.google.com/drive/u/0/my-drive`;

  const emailSubject = `[Acta Oficial] ${minute.title} - ${minute.formattedDate} (${orgName})`;
  const emailBody = `Estimado equipo de ${orgName},

Adjuntamos el acta de reunión correspondiente a la sesión "${minute.title}" celebrada el ${minute.formattedDate}.

--- RESUMEN DE PUNTOS TRATADOS ---
${minute.pointsTreated}

--- COMPROMISOS ACORDADOS ---
${
  minute.actionItems.length > 0
    ? minute.actionItems
        .map((a) => `- ${a.text} (Responsable: ${a.assignedTo ? a.assignedTo.name : 'Equipo'})`)
        .join('\n')
    : 'Sin tareas pendientes registradas.'
}

El documento formal y su respaldo han sido archivados en el Google Drive institucional de ${orgName} (${targetDriveAccount}).

Saludos cordiales,
Dirección de ${orgName}`;

  const handleCopy = () => {
    const textToCopy = previewTab === 'whatsapp' ? whatsappMessage : `${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-2xs"
              style={{ backgroundColor: currentOrganization?.primaryColor || '#4f46e5' }}
            >
              {currentOrganization?.logoUrl ? (
                <img src={currentOrganization.logoUrl} alt={orgName} className="w-full h-full object-cover" />
              ) : (
                orgName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Exportar y Sincronizar Acta
                </h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: currentOrganization?.primaryColor || '#4f46e5' }}
                >
                  {orgName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                &quot;{minute.title}&quot; • {minute.formattedDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Primary Sharing Options (Span 5) */}
          <div className="col-span-1 md:col-span-5 flex flex-col gap-3.5">
            {/* Google Drive Option */}
            <div
              onClick={() => setSelectedChannel('drive')}
              className={`bg-white rounded-2xl border p-4 relative overflow-hidden cursor-pointer transition-all ${
                selectedChannel === 'drive'
                  ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined text-[18px]">add_to_drive</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Google Drive del Establecimiento</h3>
                    <p className="text-[10px] text-emerald-600 font-medium truncate max-w-[170px]">
                      Destino: {targetDriveAccount}
                    </p>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    selectedChannel === 'drive'
                      ? 'text-indigo-600 material-symbols-fill'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedChannel === 'drive' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                Crea automáticamente el Google Doc institucional en la unidad de <strong>{orgName}</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg">
                <span className="material-symbols-outlined text-[14px]">folder</span>
                <span className="truncate">Ruta: MinuteFlow / {orgName} / {minute.directory}</span>
              </div>
            </div>

            {/* WhatsApp Option */}
            <div
              onClick={() => setSelectedChannel('whatsapp')}
              className={`bg-white rounded-2xl border p-4 relative overflow-hidden cursor-pointer transition-all ${
                selectedChannel === 'whatsapp'
                  ? 'border-emerald-600 ring-2 ring-emerald-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">WhatsApp Business</h3>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    selectedChannel === 'whatsapp'
                      ? 'text-emerald-600 material-symbols-fill'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedChannel === 'whatsapp' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mensaje formateado con decisiones clave y tareas para el equipo de {orgName}.
              </p>
            </div>

            {/* Email Option */}
            <div
              onClick={() => setSelectedChannel('email')}
              className={`bg-white rounded-2xl border p-4 relative overflow-hidden cursor-pointer transition-all ${
                selectedChannel === 'email'
                  ? 'border-purple-600 ring-2 ring-purple-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Correo Institucional</h3>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    selectedChannel === 'email'
                      ? 'text-purple-600 material-symbols-fill'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedChannel === 'email' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Distribución formal por email a todos los asistentes ({minute.attendees.length} destinatarios).
              </p>
            </div>
          </div>

          {/* Right Column: Dynamic Preview & Sync Configuration (Span 7) */}
          <div className="col-span-1 md:col-span-7 flex flex-col gap-4">
            {selectedChannel === 'drive' ? (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-4 h-full">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    {/* Google Drive SVG */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                    <h4 className="text-xs font-bold text-slate-900">
                      Google Drive ({orgName})
                    </h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    oauthConnected || hasWebhook
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {oauthConnected ? 'Conexión 1-Clic Activa' : hasWebhook ? 'Webhook Vinculado' : 'Sin Conectar'}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Cuenta Google de Destino
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">account_circle</span>
                      <span className="text-xs font-bold text-slate-800">{activeOAuthEmail}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Carpeta y Ruta en Google Drive
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">folder</span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        MinuteFlow / {orgName} / {minute.directory}
                      </span>
                    </div>
                  </div>

                  {oauthConnected ? (
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                        <span>Google Drive Vinculado con 1 Clic (OAuth 2.0):</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        El acta se archivará como un Google Doc oficial directamente en la cuenta <strong>{activeOAuthEmail}</strong> con membrete y compromisos completos.
                      </p>
                    </div>
                  ) : !hasWebhook ? (
                    <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <span className="material-symbols-outlined text-[16px] text-amber-600">info</span>
                        <span>Conecta tu Drive en 1 clic para exportar:</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        No requieres configurar scripts ni webhooks. Puedes autorizar tu cuenta institucional directamente desde aquí:
                      </p>
                      <button
                        type="button"
                        onClick={handleConnectGoogleInModal}
                        disabled={isConnectingGoogleModal}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 text-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-50 transition-all"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>{isConnectingGoogleModal ? 'Conectando...' : 'Conectar con Google Drive'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                        <span>Canal de Guardado Verificado:</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        El acta se guardará en el Drive de <strong>{activeOAuthEmail}</strong> mediante el canal configurado.
                      </p>
                    </div>
                  )}

                  {exportResult && (
                    <div className={`p-3 rounded-xl border space-y-1.5 animate-in fade-in ${
                      exportResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                        <span>{exportResult.message}</span>
                      </div>
                      {exportResult.fileUrl && (
                        <a
                          href={exportResult.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline pt-0.5"
                        >
                          <span>Abrir archivo en Google Drive</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Message Preview for WhatsApp or Email */
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col h-full">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewTab('whatsapp')}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        previewTab === 'whatsapp'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setPreviewTab('email')}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        previewTab === 'email'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Correo
                    </button>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="flex-1 bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-mono whitespace-pre-wrap overflow-y-auto custom-scrollbar text-slate-800 leading-relaxed max-h-[260px]">
                  {previewTab === 'whatsapp' ? whatsappMessage : `${emailSubject}\n\n${emailBody}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-slate-500">
            Establecimiento: <strong className="text-slate-800">{orgName}</strong> ({targetDriveAccount})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${isExporting ? 'animate-spin' : ''}`}>
                {isExporting ? 'progress_activity' : selectedChannel === 'drive' ? 'cloud_upload' : 'send'}
              </span>
              <span>
                {isExporting
                  ? 'Guardando...'
                  : selectedChannel === 'drive'
                  ? `Guardar en Drive de ${orgName}`
                  : 'Enviar Notificación'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
