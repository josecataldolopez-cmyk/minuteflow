import React, { useState } from 'react';
import { Attendee } from '../types';
import { AVATAR_PRESETS } from '../data/mockData';

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAttendees: Attendee[];
  allContacts: Attendee[];
  onToggleAttendee: (attendee: Attendee) => void;
  onCreateContact: (newContact: Attendee) => void;
  onUpdateContact?: (updatedContact: Attendee) => void;
  onDeleteContact?: (id: string) => void;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  isOpen,
  onClose,
  currentAttendees,
  allContacts,
  onToggleAttendee,
  onCreateContact,
  onUpdateContact,
  onDeleteContact
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'create' | 'edit'>('directory');
  const [search, setSearch] = useState('');

  // New Contact Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Edit Contact State
  const [editingContact, setEditingContact] = useState<Attendee | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCustomAvatarUrl, setEditCustomAvatarUrl] = useState('');
  const [editError, setEditError] = useState('');

  // Confirm Delete State
  const [contactToDelete, setContactToDelete] = useState<Attendee | null>(null);

  if (!isOpen) return null;

  const filtered = allContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.role && c.role.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Por favor ingresa el nombre completo del asistente.');
      return;
    }

    const email = newEmail.trim()
      ? newEmail.trim()
      : `${newName.toLowerCase().replace(/\s+/g, '.')}@empresa.com`;

    const avatar = customAvatarUrl.trim() || selectedAvatar;

    const newContact: Attendee = {
      id: `att-custom-${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim() || 'Asistente / Invitado',
      email,
      avatarUrl: avatar
    };

    onCreateContact(newContact);
    // Also toggle/add them into the current meeting
    onToggleAttendee(newContact);

    // Reset Form
    setNewName('');
    setNewRole('');
    setNewEmail('');
    setCustomAvatarUrl('');
    setFormError('');
    setActiveTab('directory');
  };

  const startEditContact = (contact: Attendee) => {
    setEditingContact(contact);
    setEditName(contact.name);
    setEditRole(contact.role || '');
    setEditEmail(contact.email || '');
    setEditAvatar(contact.avatarUrl || AVATAR_PRESETS[0]);
    setEditCustomAvatarUrl(
      AVATAR_PRESETS.includes(contact.avatarUrl || '') ? '' : contact.avatarUrl || ''
    );
    setEditError('');
    setActiveTab('edit');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    if (!editName.trim()) {
      setEditError('El nombre no puede estar vacío.');
      return;
    }

    const updatedAvatar = editCustomAvatarUrl.trim() || editAvatar || AVATAR_PRESETS[0];

    const updated: Attendee = {
      ...editingContact,
      name: editName.trim(),
      role: editRole.trim() || 'Asistente / Invitado',
      email: editEmail.trim() || `${editName.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
      avatarUrl: updatedAvatar
    };

    if (onUpdateContact) {
      onUpdateContact(updated);
    }

    setEditingContact(null);
    setActiveTab('directory');
  };

  const handleConfirmDelete = () => {
    if (contactToDelete && onDeleteContact) {
      onDeleteContact(contactToDelete.id);
      setContactToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Gestión de Asistentes</h3>
              <p className="text-xs text-slate-500">
                Selecciona, edita o elimina miembros del directorio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mt-4">
          <button
            onClick={() => {
              setEditingContact(null);
              setActiveTab('directory');
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'directory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">contacts</span>
            <span>Directorio ({allContacts.length})</span>
          </button>
          <button
            onClick={() => {
              setEditingContact(null);
              setActiveTab('create');
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Nuevo Asistente</span>
          </button>
          {activeTab === 'edit' && editingContact && (
            <button
              className="flex-1 py-2.5 text-xs font-bold border-b-2 border-indigo-600 text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span className="truncate max-w-[110px]">Editar: {editingContact.name}</span>
            </button>
          )}
        </div>

        {/* Confirm Delete Banner */}
        {contactToDelete && (
          <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
              <span className="material-symbols-outlined text-[18px] text-rose-600">warning</span>
              <span>¿Eliminar a &quot;{contactToDelete.name}&quot; del directorio?</span>
            </div>
            <p className="text-[11px] text-rose-600">
              Se removerá permanentemente del directorio de asistentes y reuniones.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Directory List */}
        {activeTab === 'directory' && (
          <div className="flex flex-col flex-1 min-h-0 pt-4">
            <div className="mb-3 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, cargo o correo..."
                className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[220px]">
              {filtered.map((contact) => {
                const isSelected = currentAttendees.some((a) => a.id === contact.id);

                return (
                  <div
                    key={contact.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all border group ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-200 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div
                      onClick={() => onToggleAttendee(contact)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {contact.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {contact.role || 'Asistente'} • {contact.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {/* Toggle Included in Meeting Button */}
                      <button
                        type="button"
                        onClick={() => onToggleAttendee(contact)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isSelected ? 'check' : 'add'}
                        </span>
                        <span>{isSelected ? 'Incluido' : 'Agregar'}</span>
                      </button>

                      {/* Edit Button for Any Contact */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditContact(contact);
                        }}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Editar información de este asistente"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>

                      {/* Delete Button for Any Contact */}
                      {onDeleteContact && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactToDelete(contact);
                          }}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar del directorio"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-slate-300 text-4xl mb-1">
                    person_search
                  </span>
                  <p className="text-xs text-slate-600 font-semibold">
                    No se encontró a nadie con &quot;{search}&quot;
                  </p>
                  <button
                    onClick={() => {
                      setNewName(search);
                      setActiveTab('create');
                    }}
                    className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    + Registrar &quot;{search}&quot; como nuevo asistente
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {currentAttendees.length} asistente(s) seleccionado(s)
              </span>
              <button
                onClick={onClose}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Create Custom Attendee Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0 pt-4">
            <div className="space-y-3.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="ej. Lic. Carlos Mendoza o Ing. Sofía Reyes"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cargo / Rol en la Reunión
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="ej. Asesor Legal Externo, Gerente TI"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="carlos.m@empresa.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Foto de Perfil / Avatar
                </label>
                <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset);
                        setCustomAvatarUrl('');
                      }}
                      className={`relative rounded-full p-0.5 transition-all cursor-pointer shrink-0 ${
                        selectedAvatar === preset && !customAvatarUrl
                          ? 'ring-2 ring-indigo-600 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset}
                        alt="Avatar preset"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="O pega una URL de imagen personalizada (opcional)..."
                    className="flex-1 text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Volver al Directorio
              </button>
              <button
                type="submit"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Guardar e Incluir en el Acta</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Edit Existing Attendee Form */}
        {activeTab === 'edit' && editingContact && (
          <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 pt-4 animate-in fade-in">
            <div className="space-y-3.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {editError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editError) setEditError('');
                  }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    placeholder="ej. Director Financiero, Asesor Legal"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="ejemplo@minuteflow.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Foto de Perfil / Avatar
                </label>
                <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditAvatar(preset);
                        setEditCustomAvatarUrl('');
                      }}
                      className={`relative rounded-full p-0.5 transition-all cursor-pointer shrink-0 ${
                        editAvatar === preset && !editCustomAvatarUrl
                          ? 'ring-2 ring-indigo-600 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset}
                        alt="Avatar preset"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editCustomAvatarUrl}
                    onChange={(e) => setEditCustomAvatarUrl(e.target.value)}
                    placeholder="O ingresa una URL de foto personalizada..."
                    className="flex-1 text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setEditingContact(null);
                  setActiveTab('directory');
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
