import React, { useState } from 'react';
import { MeetingMinute } from '../types';

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
    minute?.folderPath || 'Reuniones de Directorio Q3 / Oct'
  );
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !minute) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      onExportSuccess(selectedChannel);
      onClose();
    }, 900);
  };

  const whatsappMessage = `📋 *Resumen MinuteFlow: ${minute.title}*
${minute.formattedDate}

🎯 *Decisiones Clave:*
${
  minute.keyDecisions.length > 0
    ? minute.keyDecisions.map((kd) => `• ${kd}`).join('\n')
    : '• Aprobada la agenda de la reunión y los próximos hitos.'
}

⚡ *Tareas y Compromisos:*
${
  minute.actionItems.length > 0
    ? minute.actionItems
        .map(
          (act) =>
            `• @${act.assignedTo ? act.assignedTo.name : 'Equipo'} - ${act.text} (${
              act.priority || 'Pendiente'
            })`
        )
        .join('\n')
    : '• Revisar entregables con los líderes de departamento'
}

🔗 Ver documento completo (Enlace Google Drive)`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="exportModalOverlay"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-center items-end md:items-center p-0 md:p-6 animate-in fade-in duration-200"
    >
      {/* Modal Container */}
      <div className="bg-white w-full md:w-[820px] max-h-[92vh] md:max-h-[880px] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 border border-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-[22px]">
                ios_share
              </span>
              Exportar y Compartir
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribuir las notas de &ldquo;{minute.title}&rdquo; a las partes interesadas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body: Bento Grid Layout */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-5">
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
              <div className="absolute top-3.5 right-3.5">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    selectedChannel === 'drive'
                      ? 'text-indigo-600 material-symbols-fill'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedChannel === 'drive' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-[20px]">add_to_drive</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Google Drive</h3>
              </div>

              <div className="mt-2">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Carpeta de Destino
                </label>
                <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  {isEditingFolder ? (
                    <input
                      type="text"
                      value={folderPath}
                      onChange={(e) => setFolderPath(e.target.value)}
                      onBlur={() => setIsEditingFolder(false)}
                      autoFocus
                      className="text-xs bg-white border border-indigo-500 px-1.5 py-0.5 rounded w-full outline-none"
                    />
                  ) : (
                    <span className="text-xs text-slate-800 font-medium flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-[16px] text-slate-400 material-symbols-fill">
                        folder
                      </span>
                      {folderPath}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingFolder(!isEditingFolder);
                    }}
                    className="text-slate-400 hover:text-indigo-600 ml-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-emerald-600">
                <span className="material-symbols-outlined text-[16px] material-symbols-fill">
                  sync
                </span>
                <span className="text-[11px] font-semibold">Listo para sincronizar como PDF y GDoc</span>
              </div>
            </div>

            {/* WhatsApp Option */}
            <div
              onClick={() => {
                setSelectedChannel('whatsapp');
                setPreviewTab('whatsapp');
              }}
              className={`bg-white rounded-2xl border p-4 relative cursor-pointer transition-all ${
                selectedChannel === 'whatsapp'
                  ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute top-3.5 right-3.5">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    selectedChannel === 'whatsapp'
                      ? 'text-emerald-500 material-symbols-fill'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedChannel === 'whatsapp' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp</h3>
                  <p className="text-[11px] text-slate-500">Resumen Ejecutivo</p>
                </div>
              </div>
            </div>

            {/* Email Option */}
            <div
              onClick={() => {
                setSelectedChannel('email');
                setPreviewTab('email');
              }}
              className={`bg-white rounded-2xl border p-4 relative cursor-pointer transition-all ${
                selectedChannel === 'email'
                  ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute top-3.5 right-3.5">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    selectedChannel === 'email'
                      ? 'text-indigo-600 material-symbols-fill'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedChannel === 'email' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Correo Electrónico</h3>
                  <p className="text-[11px] text-slate-500">Distribución Formal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview Area (Span 7) */}
          <div className="col-span-1 md:col-span-7 flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-100 flex flex-col h-full overflow-hidden shadow-sm">
              {/* Preview Header Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/70 px-4 pt-2">
                <button
                  onClick={() => setPreviewTab('whatsapp')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    previewTab === 'whatsapp'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-900'
                  }`}
                >
                  Vista Previa WhatsApp
                </button>
                <button
                  onClick={() => setPreviewTab('email')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    previewTab === 'email'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-900'
                  }`}
                >
                  Plantilla de Correo
                </button>
              </div>

              {/* WhatsApp Preview Content */}
              {previewTab === 'whatsapp' ? (
                <div className="p-4 bg-slate-100/70 flex-1 overflow-y-auto custom-scrollbar relative min-h-[280px]">
                  <div className="bg-white text-slate-900 p-3.5 rounded-2xl rounded-tr-none shadow-sm max-w-[95%] ml-auto relative z-10 text-xs leading-relaxed border border-slate-200">
                    <p className="font-bold text-[13px] text-slate-900">
                      📋 *Resumen MinuteFlow: {minute.title}*
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{minute.formattedDate}</p>

                    <p className="mt-2.5 font-bold text-[12px] text-slate-900">🎯 Decisiones Clave:</p>
                    <ul className="list-none pl-0 mt-1 space-y-1 text-[12px]">
                      {minute.keyDecisions.length > 0 ? (
                        minute.keyDecisions.map((dec, i) => (
                          <li key={i}>• {dec}</li>
                        ))
                      ) : (
                        <li>• Aprobado el presupuesto de marketing revisado para Q4.</li>
                      )}
                    </ul>

                    <p className="mt-2.5 font-bold text-[12px] text-slate-900">⚡ Tareas y Compromisos:</p>
                    <ul className="list-none pl-0 mt-1 space-y-1 text-[12px]">
                      {minute.actionItems.length > 0 ? (
                        minute.actionItems.map((act) => (
                          <li key={act.id}>
                            • @{act.assignedTo ? act.assignedTo.name : 'Equipo'} - {act.text}
                          </li>
                        ))
                      ) : (
                        <>
                          <li>• @Finanzas - Preparar modelos financieros (Alta)</li>
                          <li>• @Legal - Redactar acuerdo de confidencialidad</li>
                        </>
                      )}
                    </ul>

                    <p className="mt-3 text-[11px] text-indigo-600 underline cursor-pointer">
                      Ver documento completo (Enlace Google Drive)
                    </p>
                    <div className="text-right mt-1">
                      <span className="text-[10px] text-slate-400">10:42</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Template Content */
                <div className="p-4 bg-white flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between min-h-[280px]">
                  <div>
                    <div className="border-b border-slate-100 pb-2.5 mb-3 text-xs">
                      <p className="text-slate-500">
                        Para:{' '}
                        <span className="text-slate-900 font-semibold">
                          junta-directiva@minuteflow.com
                        </span>
                      </p>
                      <p className="text-slate-500 mt-1">
                        Asunto:{' '}
                        <span className="text-slate-900 font-bold">
                          Acta de Reunión: {minute.title} [{minute.formattedDate}]
                        </span>
                      </p>
                    </div>

                    <div className="text-xs text-slate-800 space-y-2 leading-relaxed">
                      <p>Estimado equipo ejecutivo y de liderazgo,</p>
                      <p>
                        Adjunto encontrarán el acta formalizada, las resoluciones y los compromisos
                        establecidos en la sesión de hoy: <strong>{minute.title}</strong>.
                      </p>
                      <p className="text-slate-500">
                        Objetivos principales cubiertos: {minute.objectives || 'Alineación y revisión estratégica.'}
                      </p>
                    </div>
                  </div>

                  {/* Attachment Pill */}
                  <div className="mt-4 flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors w-max">
                    <span className="material-symbols-outlined text-rose-500 text-[20px] material-symbols-fill">
                      picture_as_pdf
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {minute.title.replace(/\s+/g, '_')}_Acta.pdf
                    </span>
                    <span className="text-[10px] text-slate-400">1.2 MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={handleCopy}
            className="text-xs font-semibold text-indigo-600 hover:bg-white px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? '¡Copiado!' : 'Copiar Resumen'}</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              id="btn-export-and-send"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isExporting ? 'animate-spin' : 'material-symbols-fill'}`}>
                {isExporting ? 'sync' : 'send'}
              </span>
              <span>{isExporting ? 'Distribuyendo...' : 'Exportar y Enviar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
