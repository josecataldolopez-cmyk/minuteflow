import React, { useState } from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">policy</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Centro de Cumplimiento Legal y Privacidad
              </h2>
              <p className="text-xs text-slate-500">PactaCloud &bull; RED Q SpA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">security</span>
            Política de Privacidad y Google API
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            Términos de Servicio
          </button>
          <div className="ml-auto flex items-center">
            <a
              href={activeTab === 'privacy' ? '/privacy.html' : '/terms.html'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-indigo-600 hover:underline flex items-center gap-1"
            >
              Abrir enlace público
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </a>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh]">
          {activeTab === 'privacy' ? (
            <>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <p className="font-bold mb-1 flex items-center gap-1 text-[13px]">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
                  Cumplimiento de Políticas de Datos de Usuario de Google
                </p>
                <p className="text-[11px] leading-normal">
                  <strong>
                    El uso y la transferencia que hace PactaCloud a cualquier otra aplicación de la información recibida a través de las API de Google cumplirán con la Política de Datos de Usuario de los Servicios de API de Google, incluidos los requisitos de Uso Limitado (Limited Use requirements).
                  </strong>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Alcance de Google Drive (drive.file)</h4>
                <p>
                  PactaCloud solicita exclusivamente el permiso <code>https://www.googleapis.com/auth/drive.file</code>. Esto garantiza que la aplicación solo puede crear o editar las actas y carpetas generadas directamente desde PactaCloud. La aplicación <strong>jamás</strong> puede ver, leer, modificar ni eliminar otros documentos personales o corporativos de su Google Drive.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Aislamiento Multi-Inquilino (Multi-Tenant)</h4>
                <p>
                  Cada institución educativa u organización cuenta con un identificador único (<code>organization_id</code>). Todos los registros están aislados en base de datos PostgreSQL mediante Row-Level Security (RLS). No existe filtración ni cruce de información entre diferentes establecimientos.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Tratamiento de Asistencia IA</h4>
                <p>
                  Las notas de reuniones procesadas para generar resúmenes o acuerdos estructurados se gestionan de forma efímera en memoria cifrada. En ningún caso se emplean para entrenar modelos públicos de terceros sin su expreso consentimiento.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">4. Contacto y Derechos de Eliminación</h4>
                <p>
                  El titular puede solicitar la rectificación, exportación o supresión total de sus datos en cualquier momento comunicándose directamente con:
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  José Cataldo López &bull; Email: <a href="mailto:jose.cataldo@redq.cl" className="text-indigo-600 underline">jose.cataldo@redq.cl</a>
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Titularidad del Contenido</h4>
                <p>
                  La institución conserva todos los derechos sobre las actas, acuerdos, transcripciones y documentos elaborados en PactaCloud. RED Q SpA no reclama titularidad alguna sobre dichos contenidos.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Responsabilidad de Uso Institucional</h4>
                <p>
                  El acceso a las actas directivas está restringido a usuarios autorizados por el establecimiento. Es deber de la institución asignar roles adecuados (Administrador, Directivo, Colaborador) y proteger sus credenciales de acceso.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Integraciones Externas</h4>
                <p>
                  El usuario asume la responsabilidad de las configuraciones y credenciales conectadas (claves de webhook de Google Apps Script o tokens de Google OAuth). PactaCloud asegura la transmisión cifrada de las solicitudes hacia los servidores de Google.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-[11px] text-slate-400">
            Versión 2.0 &bull; Actualizado en Noviembre 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
