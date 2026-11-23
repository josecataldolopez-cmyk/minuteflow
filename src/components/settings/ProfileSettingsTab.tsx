import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { AVATAR_PRESETS } from '../../data/mockData';

interface ProfileSettingsTabProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (updated: UserProfile) => void;
  onShowToast: (msg: string) => void;
  compressImage: (file: File, maxDim?: number) => Promise<string>;
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  userProfile,
  onUpdateUserProfile,
  onShowToast,
  compressImage
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name || '');
  const [role, setRole] = useState(userProfile.role || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [department, setDepartment] = useState(userProfile.department || 'Dirección General de Operaciones');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Sincronizar campos cuando cambie userProfile
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setRole(userProfile.role || '');
      setEmail(userProfile.email || '');
      setDepartment(userProfile.department || 'Dirección General de Operaciones');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 200);
      if (compressed) {
        setAvatarUrl(compressed);
        setCustomAvatarInput('');
        onShowToast('Foto de perfil optimizada y cargada. Guarda para confirmar.');
      }
    } catch {
      onShowToast('No se pudo procesar la foto');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('El nombre no puede estar vacío');
      return;
    }
    if (!email.trim()) {
      onShowToast('El correo electrónico no puede estar vacío');
      return;
    }

    const finalAvatar = customAvatarInput.trim() || avatarUrl;
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim(),
      role: role.trim() || 'Ejecutivo',
      email: email.trim(),
      department: department.trim(),
      avatarUrl: finalAvatar
    };

    onUpdateUserProfile(updated);
    setIsEditing(false);
    onShowToast(`Perfil actualizado con el correo ${updated.email}`);
  };

  return (
    <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={name}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-100 shadow-2xs shrink-0"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{name}</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {role}
              </span>
            </h3>
            <p className="text-xs text-slate-500">{email} • {department}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto border border-indigo-100"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            {isEditing ? 'close' : 'edit'}
          </span>
          <span>{isEditing ? 'Cancelar' : 'Editar Perfil'}</span>
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="space-y-5 pt-1">
          {/* Avatar Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]" aria-hidden="true">account_circle</span>
              Foto de Perfil o Avatar
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-[16px] text-indigo-600" aria-hidden="true">upload_file</span>
                <span>Subir imagen desde mi equipo</span>
                <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
              </label>
              <input
                type="url"
                value={customAvatarInput}
                onChange={(e) => setCustomAvatarInput(e.target.value)}
                placeholder="O URL de imagen (https://...)"
                className="flex-1 min-w-[200px] text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Avatares ejecutivos precargados:</span>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setAvatarUrl(url); setCustomAvatarInput(''); }}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      avatarUrl === url ? 'border-indigo-600 scale-105 shadow-xs' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cargo o Función</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ej. Rector / Director / Secretario"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Correo Institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Departamento / Área</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ej. Convivencia Escolar / Operaciones"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>
              <span>Guardar Perfil</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Firma de Actas:</span>
            <p className="text-xs font-bold text-slate-800">{name}</p>
            <p className="text-[10px] text-slate-500">{role}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Correo Autenticado:</span>
            <p className="text-xs font-bold text-slate-800 truncate">{email}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Área / Sede:</span>
            <p className="text-xs font-bold text-slate-800 truncate">{department}</p>
          </div>
        </div>
      )}
    </div>
  );
};
