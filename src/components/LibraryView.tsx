import React, { useState } from 'react';
import { MeetingMinute, DirectoryItem, MinuteStatus } from '../types';

interface LibraryViewProps {
  minutes: MeetingMinute[];
  directories: DirectoryItem[];
  onSelectMinute: (minute: MeetingMinute) => void;
  onOpenExport: (minute: MeetingMinute) => void;
  onDeleteMinute: (id: string) => void;
  onDuplicateMinute: (minute: MeetingMinute) => void;
  onNewMinute: () => void;
  onCreateDirectory?: (name: string, icon?: string) => void;
  onUpdateDirectory?: (id: string, newName: string, icon?: string) => void;
  onDeleteDirectory?: (id: string) => void;
  onDeleteSampleMinutes?: () => void;
  onClearAllMinutes?: () => void;
  onResetSampleMinutes?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  minutes,
  directories,
  onSelectMinute,
  onOpenExport,
  onDeleteMinute,
  onDuplicateMinute,
  onNewMinute,
  onCreateDirectory,
  onUpdateDirectory,
  onDeleteDirectory,
  onDeleteSampleMinutes,
  onClearAllMinutes,
  onResetSampleMinutes
}) => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<MinuteStatus | 'All'>('All');
  const [viewFormat, setViewFormat] = useState<'card' | 'list'>('card');
  const [selectedMinuteIds, setSelectedMinuteIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Folder modal states
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<DirectoryItem | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [deletingFolder, setDeletingFolder] = useState<DirectoryItem | null>(null);

  // Minute deletion modal states
  const [minuteToDelete, setMinuteToDelete] = useState<MeetingMinute | null>(null);
  const [showDeleteSampleModal, setShowDeleteSampleModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filter minutes
  const filteredMinutes = minutes.filter((minute) => {
    const matchesDir = selectedDirectory ? minute.directory === selectedDirectory : true;
    const matchesTag = selectedTag === 'All' ? true : minute.status === selectedTag;
    return matchesDir && matchesTag;
  });

  const handleSelectAll = () => {
    if (selectedMinuteIds.length === filteredMinutes.length) {
      setSelectedMinuteIds([]);
    } else {
      setSelectedMinuteIds(filteredMinutes.map((m) => m.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMinuteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    selectedMinuteIds.forEach((id) => onDeleteMinute(id));
    setSelectedMinuteIds([]);
    setShowBulkDeleteModal(false);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
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
    // If currently filtered by the old directory name, update selected directory
    if (selectedDirectory === editingFolder.name) {
      setSelectedDirectory(editFolderName.trim());
    }
    setEditingFolder(null);
    setEditFolderName('');
  };

  const handleDeleteFolderConfirm = () => {
    if (!deletingFolder) return;
    if (onDeleteDirectory) {
      onDeleteDirectory(deletingFolder.id);
    }
    if (selectedDirectory === deletingFolder.name) {
      setSelectedDirectory(null);
    }
    setDeletingFolder(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 custom-scrollbar">
      <div className="max-w-7xl mx-auto pb-24 flex flex-col gap-6">
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">
              Biblioteca de Actas
            </h1>
            <p className="text-sm text-slate-500">
              Gestiona, filtra y organiza tus carpetas y actas de reuniones ejecutivas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Actions for Sample Minutes & Folders */}
            <button
              onClick={() => setIsAddingFolder(true)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-indigo-600">create_new_folder</span>
              <span>Nueva Carpeta</span>
            </button>

            {minutes.length > 0 ? (
              <button
                onClick={() => setShowDeleteSampleModal(true)}
                className="text-xs font-semibold text-rose-600 bg-rose-50/70 border border-rose-200/70 hover:bg-rose-100 hover:border-rose-300 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Eliminar actas precargadas de muestra"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                <span>Limpiar Actas de Ejemplo</span>
              </button>
            ) : (
              onResetSampleMinutes && (
                <button
                  onClick={onResetSampleMinutes}
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Cargar Actas de Ejemplo</span>
                </button>
              )
            )}

            <button
              onClick={onNewMinute}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Nueva Acta</span>
            </button>

            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setViewFormat('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewFormat === 'card'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
              <button
                onClick={() => setViewFormat('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewFormat === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_list</span>
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Directories & Smart Tags Sidebar (Span 3) */}
          <div className="col-span-12 md:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-6 self-start">
            {/* Directories Section */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Carpetas
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({directories.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDirectory && (
                    <button
                      onClick={() => setSelectedDirectory(null)}
                      className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      Quitar Filtro
                    </button>
                  )}
                  <button
                    onClick={() => setIsAddingFolder(true)}
                    className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Crear nueva carpeta"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>

              {/* Inline Add Folder Form */}
              {isAddingFolder && (
                <form onSubmit={handleCreateFolderSubmit} className="mb-3 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                    Nueva Carpeta
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nombre..."
                      autoFocus
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer shrink-0"
                    >
                      Crear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingFolder(false);
                        setNewFolderName('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </form>
              )}

              <ul className="flex flex-col gap-1 text-sm font-medium">
                <li
                  onClick={() => setSelectedDirectory(null)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    selectedDirectory === null
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-indigo-600">
                      folder_open
                    </span>
                    <span>Todas las carpetas</span>
                  </div>
                  <span className="text-xs text-slate-400 font-normal">{minutes.length}</span>
                </li>

                {directories.map((dir) => {
                  const isSelected = selectedDirectory === dir.name;
                  const count = minutes.filter((m) => m.directory === dir.name).length;
                  return (
                    <li
                      key={dir.id}
                      onClick={() => setSelectedDirectory(isSelected ? null : dir.name)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0 pr-1">
                        <span
                          className={`material-symbols-outlined text-[20px] shrink-0 ${
                            isSelected ? 'material-symbols-fill text-indigo-600' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? 'folder_open' : 'folder'}
                        </span>
                        <span className="truncate">{dir.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Hover action buttons for Folder Edit and Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(dir);
                            setEditFolderName(dir.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-all"
                          title="Renombrar carpeta"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingFolder(dir);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-all"
                          title="Eliminar carpeta"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>

                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-indigo-100/70 text-indigo-700 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Smart Tags */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-3">
                Etiquetas de Estado
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedTag('All')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                    selectedTag === 'All'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                  }`}
                >
                  Todas ({minutes.length})
                </button>
                <button
                  onClick={() => setSelectedTag('Borrador')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                    selectedTag === 'Borrador' || selectedTag === 'Draft'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-100'
                  }`}
                >
                  Borrador
                </button>
                <button
                  onClick={() => setSelectedTag('Aprobada')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                    selectedTag === 'Aprobada' || selectedTag === 'Approved'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100'
                  }`}
                >
                  Aprobada
                </button>
                <button
                  onClick={() => setSelectedTag('Pendiente de firma')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                    selectedTag === 'Pendiente de firma' || selectedTag === 'Pending Sig'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100'
                  }`}
                >
                  Pendiente
                </button>
                <button
                  onClick={() => setSelectedTag('Finalizada')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                    selectedTag === 'Finalizada' || selectedTag === 'Finished'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Finalizada
                </button>
              </div>
            </div>
          </div>

          {/* Main Minutes Content Area (Span 9) */}
          <div className="col-span-12 md:col-span-9 flex flex-col gap-4">
            {/* Bulk Actions Bar */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    filteredMinutes.length > 0 &&
                    selectedMinuteIds.length === filteredMinutes.length
                  }
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 ml-1 cursor-pointer"
                />
                <span className="text-xs md:text-sm font-medium text-slate-600">
                  {selectedMinuteIds.length > 0
                    ? `${selectedMinuteIds.length} Seleccionadas`
                    : 'Seleccionar todo'}
                </span>
              </div>

              <div
                className={`flex gap-1.5 items-center transition-opacity ${
                  selectedMinuteIds.length === 0 ? 'opacity-40 pointer-events-none' : 'opacity-100'
                }`}
              >
                <button
                  onClick={() => {
                    const selected = minutes.filter((m) => selectedMinuteIds.includes(m.id));
                    if (selected.length > 0) onOpenExport(selected[0]);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Exportar / Descargar"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                  title="Eliminar Seleccionadas"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>

            {/* Minutes Display: Cards or List */}
            {filteredMinutes.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">
                    folder_open
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">No hay actas registradas</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {selectedDirectory
                    ? `No se encontraron actas dentro de la carpeta "${selectedDirectory}".`
                    : 'Tu biblioteca está lista para tus nuevas reuniones. Crea tu primera acta o restablece ejemplos.'}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={onNewMinute}
                    className="text-xs bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Crear Nueva Acta</span>
                  </button>
                  {onResetSampleMinutes && (
                    <button
                      onClick={onResetSampleMinutes}
                      className="text-xs bg-slate-100 text-slate-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      <span>Restablecer Ejemplos</span>
                    </button>
                  )}
                </div>
              </div>
            ) : viewFormat === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMinutes.map((minute) => {
                  const isSelected = selectedMinuteIds.includes(minute.id);
                  return (
                    <div
                      key={minute.id}
                      onClick={() => onSelectMinute(minute)}
                      className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative flex flex-col h-full ${
                        isSelected ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-100'
                      }`}
                    >
                      {/* Checkbox Hover Reveal */}
                      <div
                        onClick={(e) => handleToggleSelect(minute.id, e)}
                        className={`absolute top-4 left-4 z-10 transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </div>

                      {/* Header Area */}
                      <div className="flex justify-between items-start mb-3 pl-6 group-hover:pl-6 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
                          <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                            description
                          </span>
                        </div>

                        {/* 3-dot dropdown menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === minute.id ? null : minute.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                          </button>

                          {openMenuId === minute.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in"
                            >
                              <button
                                onClick={() => {
                                  onSelectMinute(minute);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-slate-400">edit</span>
                                Abrir Editor
                              </button>
                              <button
                                onClick={() => {
                                  onOpenExport(minute);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-slate-400">
                                  ios_share
                                </span>
                                Exportar y Compartir
                              </button>
                              <button
                                onClick={() => {
                                  onDuplicateMinute(minute);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-slate-400">
                                  content_copy
                                </span>
                                Duplicar
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                onClick={() => {
                                  setMinuteToDelete(minute);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Eliminar Acta
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Folder tag + Title */}
                      <div className="mb-1">
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-md inline-block mb-1">
                          📁 {minute.directory}
                        </span>
                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {minute.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-1 leading-relaxed">
                        {minute.objectives ||
                          minute.pointsTreated.split('\n')[0] ||
                          'Puntos y acuerdos clave de la reunión ejecutiva.'}
                      </p>

                      {/* Footer Info */}
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              minute.status === 'Approved' || minute.status === 'Aprobada'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                : minute.status === 'Draft' || minute.status === 'Borrador'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50'
                                : minute.status === 'Pending Sig' || minute.status === 'Pendiente de firma'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {minute.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {minute.formattedDate}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {minute.attendees.map((att) => (
                                <img
                                  key={att.id}
                                  src={att.avatarUrl}
                                  alt={att.name}
                                  title={att.name}
                                  className="w-5 h-5 rounded-full border border-white object-cover"
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {minute.attendees.length > 2
                                ? `+${minute.attendees.length - 2} asistentes`
                                : `${minute.attendees.length} asistente${minute.attendees.length > 1 ? 's' : ''}`}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenExport(minute);
                            }}
                            className="text-indigo-600 hover:text-indigo-700 p-1 text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">ios_share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View Table */
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredMinutes.length > 0 &&
                            selectedMinuteIds.length === filteredMinutes.length
                          }
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Título</th>
                      <th className="p-3 hidden sm:table-cell">Carpeta</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 hidden md:table-cell">Fecha</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMinutes.map((minute) => (
                      <tr
                        key={minute.id}
                        onClick={() => onSelectMinute(minute)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMinuteIds.includes(minute.id)}
                            onChange={(e) => handleToggleSelect(minute.id, e as unknown as React.MouseEvent)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{minute.title}</td>
                        <td className="p-3 text-slate-500 hidden sm:table-cell">📁 {minute.directory}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              minute.status === 'Approved' || minute.status === 'Aprobada'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                : minute.status === 'Draft' || minute.status === 'Borrador'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            }`}
                          >
                            {minute.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 hidden md:table-cell">
                          {minute.formattedDate}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenExport(minute)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                              title="Exportar"
                            >
                              <span className="material-symbols-outlined text-[18px]">ios_share</span>
                            </button>
                            <button
                              onClick={() => setMinuteToDelete(minute)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                <p className="text-xs text-slate-500">Actualiza el nombre para todas las actas asociadas.</p>
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
      {deletingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">folder_delete</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar carpeta "{deletingFolder.name}"?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Las actas contenidas en esta carpeta no se borrarán; serán reubicadas automáticamente en tu carpeta general.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFolder(null)}
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

      {/* Delete Single Minute Modal */}
      {minuteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar esta acta de reunión?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Se borrará "<span className="font-semibold text-slate-700">{minuteToDelete.title}</span>". Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMinuteToDelete(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMinute(minuteToDelete.id);
                  setMinuteToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sample Minutes Modal */}
      {showDeleteSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_sweep</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar actas de ejemplo precargadas?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Esto eliminará las actas de muestra predeterminadas para que puedas comenzar desde cero con las actas de tu propia empresa u organización. Siempre podrás restaurarlas desde Configuración si lo deseas.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSampleModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSampleMinutes) onDeleteSampleMinutes();
                  setShowDeleteSampleModal(false);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Eliminar Actas de Ejemplo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ¿Eliminar las {selectedMinuteIds.length} actas seleccionadas?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Esta acción eliminará definitivamente las actas marcadas.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Sí, Eliminar Todas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
