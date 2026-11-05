import React, { useState, useEffect, useRef } from 'react';
import { MeetingMinute, Attendee, ActionItem, DirectoryItem, MinuteStatus, Organization, UserRole } from '../types';
import { ContactPickerModal } from './ContactPickerModal';
import { analyzeAndEnhanceMinute } from '../services/aiService';

interface MinuteEditorViewProps {
  minute: MeetingMinute | null;
  directories?: DirectoryItem[];
  onSave: (minute: MeetingMinute, isDraft: boolean) => void;
  onOpenExport: (minute: MeetingMinute) => void;
  onBack: () => void;
  allAttendees: Attendee[];
  onCreateContact: (newContact: Attendee) => void;
  onUpdateContact?: (updatedContact: Attendee) => void;
  onDeleteContact?: (id: string) => void;
  onCreateDirectory?: (name: string) => void;
  onDeleteMinute?: (id: string) => void;
  currentOrganization?: Organization;
  userRole?: UserRole;
}

export const MinuteEditorView: React.FC<MinuteEditorViewProps> = ({
  minute,
  directories = [],
  onSave,
  onOpenExport,
  onBack,
  allAttendees,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
  onCreateDirectory,
  onDeleteMinute,
  currentOrganization,
  userRole = 'admin'
}) => {
  const canEdit = userRole === 'superadmin' || userRole === 'admin' || userRole === 'editor';
  // Form State
  const defaultDir = directories.length > 0 ? directories[0].name : 'Reuniones de Directorio Q3';
  const [title, setTitle] = useState(minute ? minute.title : '');
  const [directory, setDirectory] = useState(minute ? minute.directory : defaultDir);
  const [status, setStatus] = useState<MinuteStatus>(minute ? minute.status : 'Borrador');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [date, setDate] = useState(minute ? minute.date : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(minute?.time || '10:00');
  const [objectives, setObjectives] = useState(minute?.objectives || '');
  const [pointsTreated, setPointsTreated] = useState(
    minute?.pointsTreated ||
      '• Se revisaron las métricas de rendimiento y objetivos estratégicos.\n• Se aprobó la reasignación de presupuesto para adquisición digital.\n• El equipo legal procederá con la redacción de contratos.'
  );
  const [attendees, setAttendees] = useState<Attendee[]>(
    minute?.attendees || (allAttendees.length >= 2 ? [allAttendees[0], allAttendees[1]] : allAttendees)
  );
  const [nextSessionDate, setNextSessionDate] = useState(
    minute?.nextSessionDate || '2026-11-15'
  );
  const [syncCalendar, setSyncCalendar] = useState(
    minute?.syncCalendar !== undefined ? minute.syncCalendar : true
  );
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    minute?.actionItems || [
      {
        id: 'act-ed-1',
        text: 'Finalizar informe de presupuesto Q4',
        completed: false,
        priority: 'High',
        dueDate: '2026-09-15',
        assignedTo: allAttendees[0]
      },
      {
        id: 'act-ed-2',
        text: 'Preparar modelos financieros para revisión',
        completed: false,
        priority: 'Medium',
        dueDate: '2026-09-20',
        assignedTo: allAttendees[1] || allAttendees[0]
      }
    ]
  );

  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [assigningActionId, setAssigningActionId] = useState<string | null>(null);

  // AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuccessBadge, setAiSuccessBadge] = useState(false);

  // Dictation / Voice Transcription State
  const [isListening, setIsListening] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState(
    'El acuerdo principal es que el área de operaciones gestionará el despliegue regional...'
  );
  const [showTranscriptionBox, setShowTranscriptionBox] = useState(true);
  const speechRecognitionRef = useRef<any>(null);

  // Speech Recognition setup with simulation fallback
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setTranscriptionText(currentTranscript);
          }
        };

        recognition.onerror = () => {
          simulateVoiceNotes();
        };

        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition init failed, using simulation mode', err);
      }
    }
  }, []);

  const simulateVoiceNotes = () => {
    const samplePhrases = [
      'Se revisó la hoja de ruta de producto y se alinearon los hitos del trimestre...',
      'Aprobada la asignación presupuestaria para auditoría de ciberseguridad...',
      'Punto de acción para que el equipo envíe la presentación final antes del viernes...',
      'Se acuerda iniciar el dimensionamiento técnico con los proveedores de ingeniería...'
    ];
    let phraseIndex = 0;
    const interval = setInterval(() => {
      if (!isListening) {
        clearInterval(interval);
        return;
      }
      setTranscriptionText(samplePhrases[phraseIndex % samplePhrases.length]);
      phraseIndex++;
    }, 4000);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      try {
        speechRecognitionRef.current?.stop();
      } catch (e) {}
    } else {
      setIsListening(true);
      setShowTranscriptionBox(true);
      try {
        speechRecognitionRef.current?.start();
      } catch (e) {
        simulateVoiceNotes();
      }
    }
  };

  const handleInsertTranscription = () => {
    if (transcriptionText.trim()) {
      setPointsTreated((prev) => `${prev.trim()}\n• ${transcriptionText.trim()}`);
    }
  };

  // AI Assistant Action
  const handleGenerateWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      const rawText = `${objectives}\n${pointsTreated}\n${transcriptionText}`;
      const result = await analyzeAndEnhanceMinute(rawText, title);

      if (result.title && (!title || title.trim() === '')) {
        setTitle(result.title);
      }
      if (result.objectives) {
        setObjectives(result.objectives);
      }
      if (result.pointsTreated) {
        setPointsTreated(result.pointsTreated);
      }
      if (result.actionItems && result.actionItems.length > 0) {
        const newActions: ActionItem[] = result.actionItems.map((item, index) => ({
          id: `act-ai-${Date.now()}-${index}`,
          text: item.text,
          completed: false,
          dueDate: item.dueDate || date,
          priority: item.priority,
          assignedTo: attendees[index % attendees.length] || allAttendees[0]
        }));
        setActionItems((prev) => [...prev, ...newActions]);
      }

      setAiSuccessBadge(true);
      setTimeout(() => setAiSuccessBadge(false), 4000);
    } catch (error) {
      console.error('Error during AI synthesis:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddActionItem = () => {
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      text: '',
      completed: false,
      dueDate: date || new Date().toISOString().split('T')[0],
      priority: 'Medium'
    };
    setActionItems([...actionItems, newItem]);
  };

  const handleUpdateActionItemText = (id: string, text: string) => {
    setActionItems(actionItems.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const handleUpdateActionItemDueDate = (id: string, dueDate: string) => {
    setActionItems(actionItems.map((item) => (item.id === id ? { ...item, dueDate } : item)));
  };

  const handleUpdateActionItemPriority = (id: string, priority: 'Low' | 'Medium' | 'High') => {
    setActionItems(actionItems.map((item) => (item.id === id ? { ...item, priority } : item)));
  };

  const handleToggleActionItem = (id: string) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteActionItem = (id: string) => {
    setActionItems(actionItems.filter((item) => item.id !== id));
  };

  const handleAssignActionItem = (actionId: string, attendee: Attendee) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === actionId ? { ...item, assignedTo: attendee } : item
      )
    );
    setAssigningActionId(null);
  };

  const handleToggleAttendee = (attendee: Attendee) => {
    const exists = attendees.some((a) => a.id === attendee.id);
    if (exists) {
      setAttendees(attendees.filter((a) => a.id !== attendee.id));
    } else {
      setAttendees([...attendees, attendee]);
    }
  };

  const handleRemoveAttendee = (attId: string) => {
    setAttendees(attendees.filter((a) => a.id !== attId));
  };

  const handleSave = (isDraft: boolean) => {
    const finalStatus: MinuteStatus = isDraft ? 'Borrador' : status === 'Borrador' ? 'Aprobada' : status;
    const updatedMinute: MeetingMinute = {
      id: minute?.id || `min-${Date.now()}`,
      title: title.trim() || 'Acta de Reunión Sin Título',
      directory,
      date,
      formattedDate: new Date(date).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time,
      status: finalStatus,
      objectives,
      pointsTreated,
      keyDecisions: pointsTreated
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .slice(0, 4)
        .map((l) => l.replace(/^[•\-\*]\s*/, '')),
      actionItems: actionItems.filter((a) => a.text.trim().length > 0),
      attendees,
      nextSessionDate,
      syncCalendar,
      folderPath: `${directory} / Notas`,
      lastEdited: 'Justo ahora',
      organizationId: minute?.organizationId || currentOrganization?.id || 'org-redq'
    };

    onSave(updatedMinute, isDraft);
  };

  // Text formatting helpers for toolbar
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('points-treated-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = pointsTreated.substring(start, end) || 'Punto de discusión';
    const replacement = `${prefix}${selectedText}${suffix}`;
    const newText = pointsTreated.substring(0, start) + replacement + pointsTreated.substring(end);
    setPointsTreated(newText);
  };

  const handleUpdateContactItem = (updated: Attendee) => {
    if (onUpdateContact) {
      onUpdateContact(updated);
    }
    setAttendees((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setActionItems((prev) =>
      prev.map((item) =>
        item.assignedTo?.id === updated.id ? { ...item, assignedTo: updated } : item
      )
    );
  };

  const handleDeleteContactItem = (id: string) => {
    if (onDeleteContact) {
      onDeleteContact(id);
    }
    setAttendees((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateFolderInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    if (onCreateDirectory) {
      onCreateDirectory(name);
    }
    setDirectory(name);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteMinuteConfirm = () => {
    if (minute && onDeleteMinute) {
      onDeleteMinute(minute.id);
      setShowDeleteConfirm(false);
      onBack();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
      {/* Header Area for Editor */}
      <header className="px-4 md:px-8 py-3.5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Volver a la Biblioteca"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-slate-600 font-semibold">{directory}</span>
              <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
              <span className="text-slate-900 font-semibold truncate max-w-[200px]">
                {title || 'Nueva Acta de Reunión'}
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-900 mt-0.5">
              {minute ? 'Editar Acta Ejecutiva' : 'Redacción de Acta de Reunión'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status Badge Selector */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MinuteStatus)}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer ${
              status === 'Aprobada'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : status === 'Pendiente de firma'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : status === 'Finalizada'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            <option value="Borrador">📝 Borrador</option>
            <option value="Pendiente de firma">✍️ Pendiente de firma</option>
            <option value="Aprobada">✅ Aprobada</option>
            <option value="Finalizada">🔒 Finalizada</option>
          </select>

          {minute && (
            <>
              {canEdit && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  title="Eliminar esta acta"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
              <button
                onClick={() => onOpenExport(minute)}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:border-indigo-600 text-indigo-600 text-xs font-semibold hover:bg-indigo-50/50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">ios_share</span>
                <span>Exportar</span>
              </button>
            </>
          )}

          {canEdit ? (
            <>
              <button
                onClick={() => handleSave(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Guardar Borrador
              </button>
              <button
                onClick={() => handleSave(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Aprobar y Guardar</span>
              </button>
            </>
          ) : (
            <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Solo Lectura</span>
            </span>
          )}
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar esta acta de reunión?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Esta acción eliminará permanentemente "<span className="font-semibold text-slate-700">{minute?.title}</span>". No se podrá recuperar.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteMinuteConfirm}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Metadata & Controls (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-5">
            {/* Metadata Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">info</span>
                Información de la Sesión
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Título de la Reunión</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Sesión Extraordinaria de Directorio Q3"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium transition-all"
                />
              </div>

              {/* Destination Folder Selector with Inline Create */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Carpeta de Destino</label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isCreatingFolder ? 'close' : 'create_new_folder'}
                    </span>
                    <span>{isCreatingFolder ? 'Cancelar' : '+ Nueva Carpeta'}</span>
                  </button>
                </div>

                {isCreatingFolder ? (
                  <form onSubmit={handleCreateFolderInline} className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nombre de la nueva carpeta..."
                      autoFocus
                      className="flex-1 rounded-xl border border-indigo-300 bg-indigo-50/40 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shrink-0 cursor-pointer shadow-xs"
                    >
                      Guardar
                    </button>
                  </form>
                ) : (
                  <select
                    value={directory}
                    onChange={(e) => {
                      if (e.target.value === '__create_new__') {
                        setIsCreatingFolder(true);
                      } else {
                        setDirectory(e.target.value);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium transition-all cursor-pointer"
                  >
                    {directories.map((dir) => (
                      <option key={dir.id} value={dir.name}>
                        📁 {dir.name}
                      </option>
                    ))}
                    {directory && !directories.some((d) => d.name === directory) && (
                      <option value={directory}>📁 {directory}</option>
                    )}
                    <option value="__create_new__">+ Agregar nueva carpeta...</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Hora de Inicio</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Objetivo / Propósito</label>
                <textarea
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Propósito u objetivo principal de la reunión..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-medium resize-none"
                />
              </div>
            </div>

            {/* Attendees Management Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                    groups
                  </span>
                  Asistentes ({attendees.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setContactPickerOpen(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Directorio</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {attendees.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={att.avatarUrl}
                        alt={att.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">{att.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{att.role || 'Miembro'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAttendee(att.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Quitar asistente del acta"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Session Date & Sync */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                  event_repeat
                </span>
                Próxima Sesión y Sincronización
              </h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Fecha de Próxima Reunión</label>
                <input
                  type="date"
                  value={nextSessionDate}
                  onChange={(e) => setNextSessionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sync-cal"
                  checked={syncCalendar}
                  onChange={(e) => setSyncCalendar(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sync-cal" className="text-xs text-slate-600 cursor-pointer">
                  Sincronizar automáticamente con Google Calendar
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Note-taking & Action Items (8 cols) */}
          <div className="md:col-span-8 flex flex-col gap-6">
            {/* Dictation / Live Audio Assistant Banner */}
            <div className="bg-linear-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col gap-3 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600/40 border border-indigo-400/30'}`}>
                    <span className="material-symbols-outlined text-[20px] text-white">
                      {isListening ? 'mic' : 'mic_none'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Asistente de Dictado y Grabación de Voz</span>
                      {isListening && (
                        <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                          En Vivo
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-indigo-200">
                      Captura el audio de la reunión y transfórmalo en acuerdos y compromisos con IA
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                      isListening
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isListening ? 'stop' : 'mic'}
                    </span>
                    <span>{isListening ? 'Detener' : 'Grabar Voz'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGeneratingAI}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-indigo-900 hover:bg-indigo-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] text-indigo-600 ${isGeneratingAI ? 'animate-spin' : ''}`}>
                      {isGeneratingAI ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    <span>{isGeneratingAI ? 'Sintetizando...' : 'Procesar con IA'}</span>
                  </button>
                </div>
              </div>

              {showTranscriptionBox && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-indigo-200">
                    <span className="font-semibold uppercase tracking-wider">Última Transcripción Capturada:</span>
                    <button
                      onClick={handleInsertTranscription}
                      className="text-white hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      <span>Insertar en Puntos Tratados</span>
                    </button>
                  </div>
                  <p className="text-slate-100 italic font-medium leading-relaxed">
                    &quot;{transcriptionText}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Main Notes Area with AI Tool */}
            <div className="bg-white rounded-2xl flex flex-col h-[460px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                      edit_note
                    </span>
                    Puntos Tratados y Acuerdos
                  </h2>
                  {aiSuccessBadge && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full animate-in fade-in flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Optimizado con IA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Quick Button */}
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGeneratingAI}
                    className="text-xs bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-3 py-1 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Analizar notas y redactar acta formal con IA"
                  >
                    <span className={`material-symbols-outlined text-[15px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                      {isGeneratingAI ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    <span>{isGeneratingAI ? 'Generando...' : 'Redactar con IA'}</span>
                  </button>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Negrita"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_bold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Cursiva"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_italic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n• ')}
                      className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Lista con viñetas"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n1. ')}
                      className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Lista numerada"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                    </button>
                  </div>
                </div>
              </div>

              <textarea
                id="points-treated-textarea"
                rows={12}
                value={pointsTreated}
                onChange={(e) => setPointsTreated(e.target.value)}
                placeholder="Escribe o dicta aquí los temas discutidos, acuerdos tomados y notas..."
                className="w-full flex-1 p-5 text-sm text-slate-900 border-none outline-none resize-none font-sans leading-relaxed custom-scrollbar"
              />
            </div>

            {/* Action Items & Commitments Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                      check_circle
                    </span>
                    Compromisos y Tareas Derivadas ({actionItems.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asigna responsables y fechas límites para sincronizar con el calendario
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddActionItem}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Nueva Tarea</span>
                </button>
              </div>

              <div className="space-y-3">
                {actionItems.map((action) => (
                  <div
                    key={action.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      action.completed
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={action.completed}
                        onChange={() => handleToggleActionItem(action.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={action.text}
                        onChange={(e) => handleUpdateActionItemText(action.id, e.target.value)}
                        placeholder="Descripción del compromiso..."
                        className={`text-xs font-medium bg-transparent border-none outline-none flex-1 ${
                          action.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pl-7 sm:pl-0 relative">
                      {/* Due Date Picker */}
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full text-[11px] text-slate-600 border border-slate-200/50">
                        <span className="material-symbols-outlined text-[13px] text-slate-400">event</span>
                        <input
                          type="date"
                          value={action.dueDate || date}
                          onChange={(e) => handleUpdateActionItemDueDate(action.id, e.target.value)}
                          className="bg-transparent text-[11px] text-slate-700 font-medium border-none p-0 outline-none cursor-pointer"
                        />
                      </div>

                      {/* Priority Dropdown */}
                      <select
                        value={action.priority || 'Medium'}
                        onChange={(e) =>
                          handleUpdateActionItemPriority(
                            action.id,
                            e.target.value as 'Low' | 'Medium' | 'High'
                          )
                        }
                        className={`text-[11px] font-semibold px-2 py-1 rounded-full border outline-none cursor-pointer ${
                          action.priority === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : action.priority === 'Low'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="High">Alta</option>
                        <option value="Medium">Media</option>
                        <option value="Low">Baja</option>
                      </select>

                      {/* Assignee Picker */}
                      {action.assignedTo ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setAssigningActionId(
                                assigningActionId === action.id ? null : action.id
                              )
                            }
                            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer hover:bg-emerald-100"
                          >
                            <img
                              src={action.assignedTo.avatarUrl}
                              alt={action.assignedTo.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="truncate max-w-[80px]">{action.assignedTo.name}</span>
                            <span className="material-symbols-outlined text-[12px] text-emerald-600">
                              expand_more
                            </span>
                          </button>

                          {assigningActionId === action.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-20 min-w-[170px] space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 px-2 block uppercase">
                                Reasignar a:
                              </span>
                              {attendees.map((att) => (
                                <button
                                  key={att.id}
                                  type="button"
                                  onClick={() => handleAssignActionItem(action.id, att)}
                                  className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                                >
                                  <img
                                    src={att.avatarUrl}
                                    alt={att.name}
                                    className="w-4 h-4 rounded-full"
                                  />
                                  <span className="truncate">{att.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setAssigningActionId(
                                assigningActionId === action.id ? null : action.id
                              )
                            }
                            className="flex items-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">person_add</span>
                            <span>Asignar</span>
                          </button>

                          {assigningActionId === action.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-20 min-w-[170px] space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 px-2 block uppercase">
                                Asignar a:
                              </span>
                              {attendees.map((att) => (
                                <button
                                  key={att.id}
                                  type="button"
                                  onClick={() => handleAssignActionItem(action.id, att)}
                                  className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                                >
                                  <img
                                    src={att.avatarUrl}
                                    alt={att.name}
                                    className="w-4 h-4 rounded-full"
                                  />
                                  <span className="truncate">{att.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteActionItem(action.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Eliminar tarea"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendee Directory & Management Modal */}
      <ContactPickerModal
        isOpen={contactPickerOpen}
        onClose={() => setContactPickerOpen(false)}
        currentAttendees={attendees}
        allContacts={allAttendees}
        onToggleAttendee={handleToggleAttendee}
        onCreateContact={onCreateContact}
        onUpdateContact={handleUpdateContactItem}
        onDeleteContact={handleDeleteContactItem}
      />
    </div>
  );
};
