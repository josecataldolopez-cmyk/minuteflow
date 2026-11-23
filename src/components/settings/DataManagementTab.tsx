import React, { useState, useEffect } from 'react';
import { testSupabaseConnection, isSupabaseConfigured } from '../../services/supabaseClient';

interface DataManagementTabProps {
  minutesCount: number;
  onDeleteSampleMinutes?: () => void;
  onClearAllMinutes?: () => void;
  onResetSampleMinutes?: () => void;
  onShowToast: (msg: string) => void;
  orgName: string;
}

export const DataManagementTab: React.FC<DataManagementTabProps> = ({
  minutesCount,
  onDeleteSampleMinutes,
  onClearAllMinutes,
  onResetSampleMinutes,
  onShowToast,
  orgName
}) => {
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ configured: boolean; message?: string; latency?: number }>({
    configured: isSupabaseConfigured()
  });

  const [confirmClearModal, setConfirmClearModal] = useState(false);

  useEffect(() => {
    // Probar automáticamente la conexión si está configurado
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then((res) => {
        setSupabaseStatus({
          configured: true,
          message: res.message,
          latency: res.latencyMs
        });
      });
    }
  }, []);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    const res = await testSupabaseConnection();
    setIsTestingSupabase(false);
    setSupabaseStatus({
      configured: isSupabaseConfigured(),
      message: res.message,
      latency: res.latencyMs
    });
    onShowToast(res.message);
  };

  return (
    <div className="space-y-6">
      {/* Supabase Cloud Persistence Status Card */}
      <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-emerald-100">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">database</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Base de Datos en la Nube (PostgreSQL / Supabase)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  supabaseStatus.configured
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {supabaseStatus.configured ? 'Conectado a la Nube' : 'Modo Offline / Local'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Respaldo multi-tenant en PostgreSQL con políticas Row-Level Security (RLS) para <strong>{orgName}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestSupabase}
            disabled={isTestingSupabase}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <span className={`material-symbols-outlined text-[16px] ${isTestingSupabase ? 'animate-spin' : ''}`} aria-hidden="true">
              {isTestingSupabase ? 'progress_activity' : 'network_check'}
            </span>
            <span>{isTestingSupabase ? 'Verificando...' : 'Probar Conexión Supabase'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${supabaseStatus.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              Estado de la Capa de Datos:
            </span>
            {supabaseStatus.latency && (
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Latencia: {supabaseStatus.latency}ms
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {supabaseStatus.message || (
              supabaseStatus.configured
                ? 'Conexión activa con el cluster PostgreSQL de Supabase.'
                : 'La aplicación está operando en almacenamiento local seguro (LocalStorage optimizado). Para activar la sincronización multi-tenant en la nube, añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.'
            )}
          </p>
        </div>
      </div>

      {/* Danger Zone / Sample Minutes Maintenance */}
      <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-rose-100 space-y-4">
        <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">admin_panel_settings</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Mantenimiento de Actas y Almacenamiento</h3>
            <p className="text-xs text-slate-500">
              Actualmente hay <strong>{minutesCount} actas</strong> registradas para {orgName}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {onDeleteSampleMinutes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Quitar Actas de Ejemplo</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Elimina las actas precargadas de prueba de esta institución.</p>
              </div>
              <button
                type="button"
                onClick={onDeleteSampleMinutes}
                className="w-full py-1.5 px-3 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                Limpiar Ejemplos
              </button>
            </div>
          )}

          {onResetSampleMinutes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Restaurar Ejemplos</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Vuelve a cargar actas modelo con compromisos de demostración.</p>
              </div>
              <button
                type="button"
                onClick={onResetSampleMinutes}
                className="w-full py-1.5 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Restaurar Modelos
              </button>
            </div>
          )}

          {onClearAllMinutes && (
            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-rose-900">Vaciar Todas las Actas</p>
                <p className="text-[11px] text-rose-600 mt-0.5">Elimina permanentemente todas las actas de {orgName}.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClearModal(true)}
                className="w-full py-1.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Vaciar Todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[20px]">warning</span>
              ¿Confirmas vaciar todas las actas?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción eliminará todas las actas registradas para <strong>{orgName}</strong>. Esta operación es irreversible.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllMinutes) onClearAllMinutes();
                  setConfirmClearModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Sí, vaciar actas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
