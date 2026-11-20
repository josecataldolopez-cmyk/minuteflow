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
  const orgName = currentOrganization?.name || 'PactaCloud';

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r border-slate-200 bg-white py-5 px-4 shrink-0 sticky top-0 select-none z-20">
      {/* Platform Brand */}
      <div className="flex items-center justify-between mb-4 px-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs shadow-xs">
            <span className="material-symbols-outlined text-[16px]">verified</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900">Pacta</span>
            <span className="font-extrabold text-base tracking-tight text-indigo-600">Cloud</span>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-100">
          Suite
        </span>
      </div>

      {/* Establishment / Organization Card */}
      <div className="flex items-center gap-3 mb-5 px-2.5 py-2 min-w-0 bg-slate-50/80 rounded-xl border border-slate-100">
        <div
          className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {orgLogo ? (
            <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
          ) : (
            orgName.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-xs text-slate-900 tracking-tight leading-tight truncate" title={orgName}>
            {orgName}
          </h2>
          <p className="text-[10px] text-slate-500 font-medium truncate">
            {currentOrganization?.slogan || 'Espacio Institucional'}
          </p>
        </div>
      </div>

      {/* Primary Action Button: New Minute */}
      <div className="mb-6">
        <button
          onClick={onNewMinute}
          id="btn-new-minute-sidebar"
          style={{ backgroundColor: primaryColor }}
          className="w-full text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition-all active:scale-98 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
        >
          <span className="material-symbols-outlined text-[20px] material-symbols-fill" aria-hidden="true">add</span>
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
