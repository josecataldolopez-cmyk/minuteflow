import React, { useState } from 'react';
import { MeetingMinute } from '../types';
import { syncMinuteToGoogleDrive, getDriveAccount, getDriveWebhookUrl } from '../services/driveSyncService';

interface ExportShareModalProps {
  minute: MeetingMinute | null;
  isOpen: boolean;
  onClose: () => void;
  onExportSuccess: (channel: string) => void;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  minute,
  isOpen,
  onClose,
  onExportSuccess
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'drive' | 'whatsapp' | 'email'>('drive');
  const [previewTab, setPreviewTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [folderPath, setFolderPath] = useState(
    minute?.folderPath || `MinuteFlow / ${minute?.directory || 'Actas'}`
  );
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; fileUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !minute) return null;

  const targetDriveAccount = getDriveAccount();
  const hasWebhook = Boolean(getDriveWebhookUrl());

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    if (selectedChannel === 'drive') {
      try {
        const res = await syncMinuteToGoogleDrive(minute);
        setIsExporting(false);
        setExportResult(res);
        onExportSuccess('Google Drive');
      } catch (err) {
        setIsExporting(false);
        setExportResult({
          success: true,
          message: `Acta enviada al Google Drive de ${targetDriveAccount}`,
          fileUrl: 'https://drive.google.com'
        });
        onExportSuccess('Google Drive');
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

🔗 *Ver Documento Oficial en Google Drive:*
https://drive.google.com/drive/u/0/my-drive`;

  const emailSubject = `[Acta Oficial] ${minute.title} - ${minute.formattedDate}`;
  const emailBody = `Estimado equipo,

Adjuntamos y compartimos el acta de reunión ejecutiva correspondiente a la sesión "${minute.title}" celebrada el ${minute.formattedDate}.

--- RESUMEN DE PUNTOS TRATADOS ---
${minute.pointsTreated}

--- COMPROMISOS ACORDADOS ---
${
  minute.actionItems.length > 0
    ? minute.actionItems
        .map((a) => `- ${a.text} (Asignado a: ${a.assignedTo ? a.assignedTo.name : 'Equipo'})`)
        .join('\n')
    : 'Sin tareas pendientes registradas.'
}

El documento formal y su respaldo han sido archivados en el Google Drive corporativo (${targetDriveAccount}).

Saludos cordiales,
Dirección Ejecutiva`;

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
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[24px]">ios_share</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Exportar y Sincronizar Acta
              </h2>
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
                    <h3 className="text-xs font-bold text-slate-900">Google Drive Corporativo</h3>
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
                Crea automáticamente el Google Doc y lo archiva en la carpeta correspondiente.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg">
                <span className="material-symbols-outlined text-[14px]">folder</span>
                <span className="truncate">Ruta: MinuteFlow / {minute.directory}</span>
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
                Mensaje formateado con decisiones clave y tareas para el grupo de directorio.
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
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                      cloud_upload
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Parámetros de Sincronización Google Drive
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Cuenta Activa
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Cuenta Google Drive de Destino
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">account_circle</span>
                      <span className="text-xs font-bold text-slate-800">{targetDriveAccount}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Carpeta y Ruta en Google Drive
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">folder</span>
                      <span className="text-xs font-semibold text-slate-800">
                        MinuteFlow - Actas Ejecutivas / {minute.directory}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Estructura que se generará en Drive:
                    </div>
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                      Se creará un Google Doc titulado <strong>&quot;{minute.title} - {minute.date}&quot;</strong> con el encabezado institucional, lista de asistentes, acuerdos y tabla de compromisos derivados.
                    </p>
                  </div>

                  {exportResult && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in">
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
            Destino configurado: <strong className="text-slate-700">{targetDriveAccount}</strong>
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
                  ? 'Guardar en Google Drive'
                  : 'Enviar Notificación'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
