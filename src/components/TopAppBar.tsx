import React, { useState, useRef, useEffect } from 'react';
import { MeetingMinute, ViewMode, UserProfile, Organization, UserRole } from '../types';

interface TopAppBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  minutes: MeetingMinute[];
  onSelectMinute: (minute: MeetingMinute) => void;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  userProfile: UserProfile;
  organizations?: Organization[];
  currentOrganization?: Organization;
  onSelectOrganization?: (org: Organization) => void;
  onChangeUserRole?: (role: UserRole) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  searchQuery,
  onSearchChange,
  minutes,
  onSelectMinute,
  currentView,
  onNavigate,
  userProfile,
  organizations = [],
  currentOrganization,
  onSelectOrganization,
  onChangeUserRole
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications] = useState([
    { id: 1, text: 'Elena Vance aprobó "Comité de Auditoría, Seguridad y Gobernanza Cloud"', time: 'Hace 10m', unread: true },
    { id: 2, text: 'Seguridad Multi-Tenant RLS activa y validada', time: 'Hace 30m', unread: true },
    { id: 3, text: 'Sincronización de Google Drive verificada para este establecimiento', time: 'Hace 1h', unread: false }
  ]);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setShowOrgSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredResults = searchQuery.trim()
    ? minutes.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.directory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.pointsTreated.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const unreadCount = notifications.filter((n) => n.unread).length;
  const activeOrg = currentOrganization || organizations[0];
  const userSystemRole = userProfile.systemRole || 'admin';

  const roleLabels: Record<UserRole, { label: string; badge: string; icon: string }> = {
    superadmin: { label: 'SuperAdmin', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: 'shield_person' },
    admin: { label: 'Administrador', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'verified_user' },
    editor: { label: 'Editor / Secretario', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: 'edit' },
    reader: { label: 'Lector (Solo Lectura)', badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'visibility' }
  };

  return (
    <header className="bg-white border-b border-slate-200 w-full h-16 shadow-xs flex justify-between items-center px-4 md:px-8 flex-shrink-0 z-30 sticky top-0">
      {/* Left: Organization / Establishment Selector Pill */}
      <div className="flex items-center gap-3">
        {/* Mobile Branding */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-100">
            MF
          </div>
        </div>

        {/* Multi-Tenant Organization Switcher */}
        {activeOrg && (
          <div ref={orgRef} className="relative">
            <button
              onClick={() => setShowOrgSelector(!showOrgSelector)}
              title="Cambiar de Establecimiento / Organización"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-white transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[17px]">domain</span>
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[170px]">
                    {activeOrg.name}
                  </span>
                  <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-indigo-600">
                    expand_more
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Espacio Privado • ID: {activeOrg.code}</span>
                </div>
              </div>
            </button>

            {/* Organizations Dropdown */}
            {showOrgSelector && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Aislamiento por Establecimiento
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Multi-Tenant RLS
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                  Cada establecimiento tiene sus propias actas, directorios, miembros y <strong>cuenta de Google Drive</strong> totalmente aisladas.
                </p>

                <div className="space-y-1.5">
                  {organizations.map((org) => {
                    const isSelected = org.id === activeOrg.id;
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          if (onSelectOrganization) onSelectOrganization(org);
                          setShowOrgSelector(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 border border-indigo-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">domain</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{org.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              RUT: {org.taxId || 'N/A'} • Drive: {org.driveAccount || 'Configurado'}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-indigo-600 text-[18px] shrink-0">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Role Switcher for Testing Security */}
                {onChangeUserRole && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Probar Nivel de Permiso (Rol):</span>
                      <span className="text-indigo-600 font-bold">{userSystemRole}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['admin', 'editor', 'reader'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            onChangeUserRole(r);
                            setShowOrgSelector(false);
                          }}
                          className={`text-[10px] font-bold py-1 px-1.5 rounded-lg border transition-all cursor-pointer text-center capitalize ${
                            userSystemRole === r
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {r === 'admin' ? '🛡️ Admin' : r === 'editor' ? '✍️ Editor' : '👁️ Lector'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Role Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs font-semibold text-slate-700">
          <span className="material-symbols-outlined text-[16px] text-indigo-600">
            {roleLabels[userSystemRole]?.icon || 'verified_user'}
          </span>
          <span className="text-[11px] font-bold">{roleLabels[userSystemRole]?.label || 'Usuario'}</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} className="hidden md:flex flex-1 max-w-lg mx-auto relative px-4">
        <span className="material-symbols-outlined absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 text-[19px] pointer-events-none">
          search
        </span>
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowSearchDropdown(true);
          }}
          onFocus={() => setShowSearchDropdown(true)}
          placeholder={`Buscar en actas de ${activeOrg?.name || 'este establecimiento'}...`}
          className="w-full pl-10 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100">
              Actas de {activeOrg?.name} ({filteredResults.length})
            </div>
            {filteredResults.length > 0 ? (
              filteredResults.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMinute(m);
                    setShowSearchDropdown(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px] shrink-0">
                      description
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">{m.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{m.directory} • {m.formattedDate}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      m.status === 'Approved' || m.status === 'Aprobada'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No se encontraron actas que coincidan con &quot;{searchQuery}&quot; en este establecimiento.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto md:ml-0">
        {/* Quick View switcher */}
        <button
          onClick={() => onNavigate(currentView === 'library' ? 'dashboard' : 'library')}
          title="Alternar entre Tablero y Biblioteca"
          className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors p-2 rounded-xl active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">
            {currentView === 'library' ? 'dashboard' : 'folder'}
          </span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            id="btn-notifications"
            title="Notificaciones y Seguridad"
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors p-2 rounded-xl active:scale-95 relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900">Notificaciones de Seguridad</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  RLS Activo
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-xl bg-slate-50 text-xs text-slate-700 flex flex-col gap-0.5">
                    <p className="font-medium">{n.text}</p>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Shortcut */}
        <button
          onClick={() => onNavigate('settings')}
          title="Configuración del Establecimiento y Google Drive"
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            currentView === 'settings'
              ? 'bg-indigo-50 text-indigo-600 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        {/* User Profile Avatar with Menu */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-100 transition-all cursor-pointer"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in space-y-3">
              <div className="border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900">{userProfile.name}</h4>
                <p className="text-[11px] text-slate-500 truncate">{userProfile.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleLabels[userSystemRole]?.badge}`}>
                    {roleLabels[userSystemRole]?.label}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">{activeOrg.name}</span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px] text-slate-400">person</span>
                  <span>Mi Perfil y Establecimiento</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px] text-indigo-600">add_to_drive</span>
                  <span>Google Drive del Establecimiento</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
