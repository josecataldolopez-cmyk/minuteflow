import React from 'react';

interface AuthGateScreenProps {
  onOpenAuthModal: () => void;
  onEnterDemoMode: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const AuthGateScreen: React.FC<AuthGateScreenProps> = ({
  onOpenAuthModal,
  onEnterDemoMode,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  return (
    <div className="min-h-screen w-full bg-pattern flex flex-col justify-between p-4 sm:p-8">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          {/* Header Banner */}
          <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                <span aria-hidden="true" className="material-symbols-outlined text-[24px] text-white">
                  verified_user
                </span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">PactaCloud</h1>
                <p className="text-xs text-indigo-100">Suite Ejecutiva de Actas y Gobernanza</p>
              </div>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight leading-snug mb-2">
              Gestiona las actas, acuerdos y compromisos de tu institución
            </h2>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Respaldo seguro en la nube con aislamiento por establecimiento, exportación a PDF oficial, Google Drive y Google Calendar.
            </p>
          </div>

          {/* Features & Actions */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span aria-hidden="true" className="material-symbols-outlined text-indigo-600 text-[20px] mb-1.5 block">
                  lock
                </span>
                <p className="font-bold text-slate-900">Espacio Privado</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Datos aislados y cifrados por institución.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span aria-hidden="true" className="material-symbols-outlined text-emerald-600 text-[20px] mb-1.5 block">
                  picture_as_pdf
                </span>
                <p className="font-bold text-slate-900">PDF Oficial</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Membrete, RUT, acuerdos y firmas al instante.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span aria-hidden="true" className="material-symbols-outlined text-amber-600 text-[20px] mb-1.5 block">
                  calendar_month
                </span>
                <p className="font-bold text-slate-900">Drive y Calendar</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Respaldo y citaciones automáticas.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">login</span>
                <span>Iniciar Sesión o Crear Cuenta</span>
              </button>

              <button
                type="button"
                onClick={onEnterDemoMode}
                className="w-full py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-slate-600">
                  visibility
                </span>
                <span>Explorar en Modo Demo Local (sin guardar en la nube)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <footer className="text-center pt-6 text-xs text-slate-500 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="hover:text-indigo-600 hover:underline cursor-pointer"
        >
          Política de Privacidad
        </button>
        <span aria-hidden="true">•</span>
        <button
          type="button"
          onClick={onOpenTerms}
          className="hover:text-indigo-600 hover:underline cursor-pointer"
        >
          Términos del Servicio
        </button>
      </footer>
    </div>
  );
};
