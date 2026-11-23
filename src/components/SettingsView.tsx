import React, { useState } from 'react';
import { UserProfile, Attendee, DirectoryItem, Organization, UserRole } from '../types';
import { OrganizationBrandingTab } from './settings/OrganizationBrandingTab';
import { ProfileSettingsTab } from './settings/ProfileSettingsTab';
import { GoogleDriveIntegrationTab } from './settings/GoogleDriveIntegrationTab';
import { DirectoryManagementTab } from './settings/DirectoryManagementTab';
import { FolderManagementTab } from './settings/FolderManagementTab';
import { DataManagementTab } from './settings/DataManagementTab';

export const COLOR_PRESETS = [
  { name: 'Índigo Moderno', color: '#4f46e5', secondary: '#818cf8', label: 'Tech & Ejecutivo' },
  { name: 'Azul Corporativo', color: '#1e40af', secondary: '#38bdf8', label: 'Finanzas & Legal' },
  { name: 'Esmeralda Institucional', color: '#059669', secondary: '#34d399', label: 'Educación & Colegios' },
  { name: 'Cian Innovación', color: '#0284c7', secondary: '#06b6d4', label: 'Salud & Clínicas' },
  { name: 'Borgoña / Carmesí', color: '#b91c1c', secondary: '#f87171', label: 'Institucional Tradicional' },
  { name: 'Ámbar Dorado', color: '#d97706', secondary: '#fbbf24', label: 'Gobernanza & Estado' },
  { name: 'Púrpura Imperial', color: '#7e22ce', secondary: '#c084fc', label: 'Creativo & Diseño' },
  { name: 'Pizarra Grafito', color: '#0f172a', secondary: '#64748b', label: 'Minimalista & Sobrio' }
];

export const LOGO_PRESETS = [
  {
    name: 'Tecnología & Empresa',
    url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&auto=format&fit=crop&q=80',
    type: 'Empresarial'
  },
  {
    name: 'Colegio / Educación',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&auto=format&fit=crop&q=80',
    type: 'Educacional'
  },
  {
    name: 'Salud & Clínica',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&auto=format&fit=crop&q=80',
    type: 'Médico'
  },
  {
    name: 'Gobernanza & Legal',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80',
    type: 'Institucional'
  }
];

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (updated: UserProfile) => void;
  allAttendees: Attendee[];
  onCreateContact: (newContact: Attendee) => void;
  onUpdateContact: (updatedContact: Attendee) => void;
  onDeleteContact: (id: string) => void;
  onResetContacts?: () => void;
  onShowToast: (msg: string) => void;
  directories?: DirectoryItem[];
  onCreateDirectory?: (name: string, icon?: string) => void;
  onUpdateDirectory?: (id: string, newName: string, icon?: string) => void;
  onDeleteDirectory?: (id: string) => void;
  onResetDirectories?: () => void;
  minutesCount?: number;
  onDeleteSampleMinutes?: () => void;
  onClearAllMinutes?: () => void;
  onResetSampleMinutes?: () => void;
  currentOrganization?: Organization;
  onUpdateOrganization?: (updatedOrg: Organization) => void;
  userRole?: UserRole;
  hasMultipleOrgs?: boolean;
  onPurgeDemoOrganizations?: () => void;
}

type SettingsTab = 'all' | 'branding' | 'profile' | 'drive' | 'directory' | 'folders' | 'data';

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateUserProfile,
  allAttendees,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
  onResetContacts,
  onShowToast,
  directories = [],
  onCreateDirectory,
  onUpdateDirectory,
  onDeleteDirectory,
  minutesCount = 0,
  onDeleteSampleMinutes,
  onClearAllMinutes,
  onResetSampleMinutes,
  currentOrganization,
  onUpdateOrganization,
  userRole = 'admin',
  hasMultipleOrgs = false,
  onPurgeDemoOrganizations
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const orgName = currentOrganization?.name || 'Establecimiento Principal';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  // Utilidad de compresión y optimización de imágenes (HTML5 Canvas)
  const compressImage = (file: File, maxDim: number = 256): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: string; count?: number }> = [
    { id: 'all', label: 'Todo', icon: 'grid_view' },
    { id: 'branding', label: 'Marca & Logo', icon: 'palette' },
    { id: 'profile', label: 'Mi Perfil', icon: 'account_circle' },
    { id: 'drive', label: 'Google Drive', icon: 'cloud_sync' },
    { id: 'directory', label: 'Directorio', icon: 'group', count: allAttendees.length },
    { id: 'folders', label: 'Carpetas', icon: 'folder', count: directories.length },
    { id: 'data', label: 'Base de Datos', icon: 'database' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-24 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Configuración y Directorio
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gestión del espacio institucional de <strong>{orgName}</strong>, parámetros de Google Drive y directorio de miembros.
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            isAdmin ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              {isAdmin ? 'verified_user' : 'visibility'}
            </span>
            <span>Rol: {isAdmin ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Lector'}</span>
          </span>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modular Tabs */}
        {(activeTab === 'all' || activeTab === 'branding') && (
          <OrganizationBrandingTab
            currentOrganization={currentOrganization}
            onUpdateOrganization={onUpdateOrganization}
            onShowToast={onShowToast}
            isAdmin={isAdmin}
            compressImage={compressImage}
            hasMultipleOrgs={hasMultipleOrgs}
            onPurgeDemoOrganizations={onPurgeDemoOrganizations}
          />
        )}

        {(activeTab === 'all' || activeTab === 'profile') && (
          <ProfileSettingsTab
            userProfile={userProfile}
            onUpdateUserProfile={onUpdateUserProfile}
            onShowToast={onShowToast}
            compressImage={compressImage}
          />
        )}

        {(activeTab === 'all' || activeTab === 'drive') && (
          <GoogleDriveIntegrationTab
            currentOrganization={currentOrganization}
            onUpdateOrganization={onUpdateOrganization}
            directories={directories}
            onCreateDirectory={onCreateDirectory}
            onShowToast={onShowToast}
            isAdmin={isAdmin}
          />
        )}

        {(activeTab === 'all' || activeTab === 'directory') && (
          <DirectoryManagementTab
            allAttendees={allAttendees}
            onCreateContact={onCreateContact}
            onUpdateContact={onUpdateContact}
            onDeleteContact={onDeleteContact}
            onResetContacts={onResetContacts}
            onShowToast={onShowToast}
            orgName={orgName}
          />
        )}

        {(activeTab === 'all' || activeTab === 'folders') && (
          <FolderManagementTab
            directories={directories}
            onCreateDirectory={onCreateDirectory}
            onUpdateDirectory={onUpdateDirectory}
            onDeleteDirectory={onDeleteDirectory}
            onShowToast={onShowToast}
            orgName={orgName}
          />
        )}

        {(activeTab === 'all' || activeTab === 'data') && (
          <DataManagementTab
            minutesCount={minutesCount}
            onDeleteSampleMinutes={onDeleteSampleMinutes}
            onClearAllMinutes={onClearAllMinutes}
            onResetSampleMinutes={onResetSampleMinutes}
            onShowToast={onShowToast}
            orgName={orgName}
          />
        )}
      </div>
    </div>
  );
};
