import React, { useState } from 'react';
import { Attendee } from '../../types';
import { AVATAR_PRESETS } from '../../data/mockData';

interface DirectoryManagementTabProps {
  allAttendees: Attendee[];
  onCreateContact: (newContact: Attendee) => void;
  onUpdateContact: (updatedContact: Attendee) => void;
  onDeleteContact: (id: string) => void;
  onResetContacts?: () => void;
  onShowToast: (msg: string) => void;
  orgName: string;
}

export const DirectoryManagementTab: React.FC<DirectoryManagementTabProps> = ({
  allAttendees,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
  onResetContacts,
  onShowToast,
  orgName
}) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAvatar, setNewAvatar] = useState(AVATAR_PRESETS[0]);

  // Edit / Delete states
  const [editingContact, setEditingContact] = useState<Attendee | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Attendee | null>(null);

  const filtered = allAttendees.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.role && a.role.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const contact: Attendee = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      role: newRole.trim() || 'Miembro',
      email: newEmail.trim() || undefined,
      avatarUrl: newAvatar,
      isCustom: true
    };

    onCreateContact(contact);
    setNewName('');
    setNewRole('');
    setNewEmail('');
    setIsAdding(false);
    onShowToast(`"${contact.name}" agregado al directorio de ${orgName}`);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editingContact.name.trim()) return;

    onUpdateContact(editingContact);
    onShowToast(`"${editingContact.name}" actualizado con éxito`);
    setEditingContact(null);
  };

  const handleDeleteConfirm = () => {
    if (!contactToDelete) return;
    onDeleteContact(contactToDelete.id);
    onShowToast(`"${contactToDelete.name}" fue removido del directorio`);
    setContactToDelete(null);
  };

  return (
    <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-indigo-100">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">group</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Directorio Institucional de Miembros</h3>
            <p className="text-xs text-slate-500">
              {allAttendees.length} integrantes convocables para actas y comités de <strong>{orgName}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            {isAdding ? 'close' : 'person_add'}
          </span>
          <span>{isAdding ? 'Cancelar' : 'Agregar Miembro'}</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-slate-50 border border-indigo-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-800">Nuevo Integrante del Establecimiento:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre y Apellidos..."
              required
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Cargo (ej. Coordinador Académico)"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="correo@institucion.cl"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
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

      {/* Search Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por nombre, cargo o correo..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((att) => (
          <div key={att.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-300 transition-all flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-2.5 min-w-0">
              <img src={att.avatarUrl} alt={att.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{att.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{att.role || 'Miembro'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setEditingContact(att)}
                title="Editar miembro"
                aria-label={`Editar ${att.name}`}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit</span>
              </button>
              <button
                type="button"
                onClick={() => setContactToDelete(att)}
                title="Eliminar miembro"
                aria-label={`Eliminar ${att.name}`}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">edit</span>
              Editar Datos del Integrante
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cargo</label>
                <input
                  type="text"
                  value={editingContact.role || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, role: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Correo</label>
                <input
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Contact Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[20px]">warning</span>
              ¿Remover del Directorio?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Estás seguro de remover a <strong>{contactToDelete.name}</strong> ({contactToDelete.role}) del directorio institucional? Las actas históricas conservarán su registro.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Sí, remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
