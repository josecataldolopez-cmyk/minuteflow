import React from 'react';
import { ViewMode, Organization } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onNewMinute: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  currentOrganization?: Organization;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onNewMinute,
  isSyncing,
  onTriggerSync,
  currentOrganization
}) => {
  const primaryColor = currentOrganization?.primaryColor || '#4f46e5';
  const orgLogo = currentOrganization?.logoUrl;
  const orgName = currentOrganization?.name || 'MinuteFlow';

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r border-slate-200 bg-white py-6 px-4 shrink-0 sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6 px-2 min-w-0">
        <div
          className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0 overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {orgLogo ? (
            <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
          ) : (
            orgName.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-base text-slate-900 tracking-tight leading-tight truncate" title={orgName}>
            {orgName}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {currentOrganization?.slogan || 'Suite Ejecutiva de Actas'}
          </p>
        </div>
      </div>

      {/* Primary Action Button: New Minute */}
      <div className="mb-6">
        <button
          onClick={onNewMinute}
          id="btn-new-minute-sidebar"
          style={{ backgroundColor: primaryColor }}
          className="w-full text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition-all active:scale-98 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] material-symbols-fill">add</span>
          <span>Nueva Acta</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 font-medium text-sm">
        <button
          onClick={() => onNavigate('dashboard')}
          id="nav-dashboard"
          style={currentView === 'dashboard' ? { color: primaryColor, backgroundColor: `${primaryColor}14` } : undefined}
          className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
            currentView === 'dashboard'
              ? 'font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${currentView === 'dashboard' ? 'material-symbols-fill' : 'text-slate-400'}`}
            style={currentView === 'dashboard' ? { color: primaryColor } : undefined}
          >
            dashboard
          </span>
          <span>Panel Principal</span>
        </button>

        <button
          onClick={() => onNavigate('library')}
          id="nav-library"
          style={currentView === 'library' ? { color: primaryColor, backgroundColor: `${primaryColor}14` } : undefined}
          className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
            currentView === 'library'
              ? 'font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${currentView === 'library' ? 'material-symbols-fill' : 'text-slate-400'}`}
            style={currentView === 'library' ? { color: primaryColor } : undefined}
          >
            inventory_2
          </span>
          <span>Biblioteca</span>
        </button>

        <button
          onClick={() => onNavigate('editor')}
          id="nav-projects"
          style={(currentView === 'editor' || currentView === 'projects') ? { color: primaryColor, backgroundColor: `${primaryColor}14` } : undefined}
          className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
            currentView === 'editor' || currentView === 'projects'
              ? 'font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${(currentView === 'editor' || currentView === 'projects') ? 'material-symbols-fill' : 'text-slate-400'}`}
            style={(currentView === 'editor' || currentView === 'projects') ? { color: primaryColor } : undefined}
          >
            folder_shared
          </span>
          <span>Proyectos</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          id="nav-settings"
          style={currentView === 'settings' ? { color: primaryColor, backgroundColor: `${primaryColor}14` } : undefined}
          className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
            currentView === 'settings'
              ? 'font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${currentView === 'settings' ? 'material-symbols-fill' : 'text-slate-400'}`}
            style={currentView === 'settings' ? { color: primaryColor } : undefined}
          >
            settings
          </span>
          <span>Configuración</span>
        </button>
      </nav>

      {/* Cloud Sync Status in Footer */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <button
          onClick={onTriggerSync}
          id="btn-cloud-sync"
          title="Haz clic para sincronizar manualmente con el almacenamiento en la nube"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className={`material-symbols-outlined text-[20px] ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`}>
              {isSyncing ? 'sync' : 'cloud_done'}
            </span>
            <span className="font-semibold text-sm text-slate-800">Sincronización Cloud</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/50">
            {isSyncing ? 'Sincronizando...' : 'En vivo'}
          </span>
        </button>
      </div>
    </aside>
  );
};
