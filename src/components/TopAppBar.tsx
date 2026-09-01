import React, { useState, useRef, useEffect } from 'react';
import { MeetingMinute, ViewMode, UserProfile } from '../types';

interface TopAppBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  minutes: MeetingMinute[];
  onSelectMinute: (minute: MeetingMinute) => void;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  userProfile: UserProfile;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  searchQuery,
  onSearchChange,
  minutes,
  onSelectMinute,
  currentView,
  onNavigate,
  userProfile
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Elena Vance aprobó "Sincronización Semanal de Marketing"', time: 'Hace 10m', unread: true },
    { id: 2, text: 'Tarea que vence hoy: Finalizar propuesta de presupuesto Q3', time: 'Hace 1h', unread: true },
    { id: 3, text: 'Sincronización con Google Drive completada para Reuniones de Directorio Q3', time: 'Hace 3h', unread: false }
  ]);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
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

  return (
    <header className="bg-white border-b border-slate-200 w-full h-16 shadow-xs flex justify-between items-center px-4 md:px-8 flex-shrink-0 z-30 sticky top-0">
      {/* Mobile Branding */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-100">
          MF
        </div>
        <span className="text-lg font-bold text-slate-900">MinuteFlow</span>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl mx-auto relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
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
          placeholder="Buscar reuniones, tareas o acuerdos..."
          className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-10 focus:ring-2 focus:ring-indigo-100 font-medium text-sm transition-all outline-none"
        />
        {searchQuery ? (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        ) : (
          <button
            title="Filtrar búsqueda"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100">
              Actas coincidentes ({filteredResults.length})
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
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                      description
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{m.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{m.objectives || m.directory}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      m.status === 'Approved' || m.status === 'Aprobada'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        : m.status === 'Draft' || m.status === 'Borrador'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No se encontraron actas que coincidan con &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto md:ml-0">
        {/* Quick View switcher on mobile */}
        <button
          onClick={() => onNavigate(currentView === 'library' ? 'dashboard' : 'library')}
          title="Cambiar vista"
          className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors p-2 rounded-xl active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">
            {currentView === 'library' ? 'dashboard' : 'filter_list'}
          </span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            id="btn-notifications"
            title="Notificaciones"
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors p-2 rounded-xl active:scale-95 relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-800">Alertas Ejecutivas</h4>
                <button
                  onClick={() =>
                    setNotifications(notifications.map((n) => ({ ...n, unread: false })))
                  }
                  className="text-[11px] text-indigo-600 hover:underline font-medium cursor-pointer"
                >
                  Marcar todas como leídas
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs flex gap-2.5 items-start ${
                      n.unread ? 'bg-indigo-50/50 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-800">{n.text}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Button and Popover */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            id="btn-user-profile"
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
            title={`Perfil de ${userProfile.name}`}
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">{userProfile.name}</div>
                  <div className="text-xs text-slate-500 truncate">{userProfile.role}</div>
                </div>
              </div>
              <div className="py-2 space-y-1 text-xs text-slate-700">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-indigo-500">edit_square</span>
                  <span>Editar Mi Perfil</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">settings</span>
                  <span>Ajustes e Integraciones</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('library');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">inventory_2</span>
                  <span>Mi Archivo de Actas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
