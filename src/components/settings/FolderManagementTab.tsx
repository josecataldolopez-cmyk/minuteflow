import React, { useState } from 'react';
import { DirectoryItem } from '../../types';
import { createDriveSubfolder } from '../../services/googleDriveOAuthService';

interface FolderManagementTabProps {
  directories?: DirectoryItem[];
  onCreateDirectory?: (name: string, icon?: string) => void;
  onUpdateDirectory?: (id: string, newName: string, icon?: string) => void;
  onDeleteDirectory?: (id: string) => void;
  onShowToast: (msg: string) => void;
  orgName: string;
  orgId?: string;
}

export const FolderManagementTab: React.FC<FolderManagementTabProps> = ({
  directories = [],
  onCreateDirectory,
  onUpdateDirectory,
  onDeleteDirectory,
  onShowToast,
  orgName,
  orgId = 'org-redq'
}) => {
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<DirectoryItem | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<DirectoryItem | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !onCreateDirectory) return;
    const clean = newFolderName.trim();
    onCreateDirectory(clean, 'folder');
    setNewFolderName('');
    setIsAddingFolder(false);

    // Si hay Webhook o Google Drive conectado, crear también la carpeta física en Drive
    if (orgId) {
      createDriveSubfolder(orgId, clean, orgName).then((res) => {
        if (res.success) {
          onShowToast(`Carpeta "${clean}" sincronizada en Google Drive`);
        }
      }).catch(() => {});
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editFolderName.trim() || !onUpdateDirectory) return;
    onUpdateDirectory(editingFolder.id, editFolderName.trim(), editingFolder.icon);
    setEditingFolder(null);
  };

  const handleDeleteConfirm = () => {
    if (!folderToDelete || !onDeleteDirectory) return;
    onDeleteDirectory(folderToDelete.id);
    setFolderToDelete(null);
  };

  return (
    <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-amber-100">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">folder</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Carpetas del Sistema y Biblioteca</h3>
            <p className="text-xs text-slate-500">
              Organiza las actas oficiales de <strong>{orgName}</strong> por comités, áreas o períodos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingFolder(!isAddingFolder)}
          className="text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            {isAddingFolder ? 'close' : 'create_new_folder'}
          </span>
          <span>{isAddingFolder ? 'Cancelar' : 'Nueva Carpeta'}</span>
        </button>
      </div>

      {isAddingFolder && (
        <form onSubmit={handleCreateSubmit} className="p-4 rounded-2xl bg-slate-50 border border-amber-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800">Crear Carpeta para {orgName}:</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nombre de carpeta (ej. Consejo Académico 2026)"
              required
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">check</span>
              <span>Crear</span>
            </button>
          </div>
        </form>
      )}

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {directories.map((dir) => (
          <div
            key={dir.id}
            className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-amber-500 text-[22px] shrink-0" aria-hidden="true">folder</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{dir.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{dir.count || 0} actas archivadas</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => { setEditingFolder(dir); setEditFolderName(dir.name); }}
                title="Renombrar carpeta"
                aria-label={`Renombrar ${dir.name}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit</span>
              </button>
              <button
                type="button"
                onClick={() => setFolderToDelete(dir)}
                title="Eliminar carpeta"
                aria-label={`Eliminar ${dir.name}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]" aria-hidden="true">folder</span>
              Renombrar Carpeta
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer"
                >
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[20px]" aria-hidden="true">delete_forever</span>
              ¿Eliminar Carpeta?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Confirmas eliminar la carpeta <strong>"{folderToDelete.name}"</strong>? Las actas que contiene pasarán automáticamente a "Actas Generales" para evitar pérdida de datos.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
