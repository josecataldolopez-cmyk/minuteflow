import React, { useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Organization } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userEmail: string, orgId?: string) => void;
  availableOrganizations: Organization[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  availableOrganizations
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase no está configurado en las variables de entorno.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        if (
          error.message.includes('provider is not enabled') ||
          error.message.includes('Unsupported provider')
        ) {
          setErrorMsg(
            'El inicio de sesión con Google aún no está habilitado en tu panel de Supabase. Puedes registrarte o iniciar sesión con tu correo y contraseña en el formulario inferior mientras tanto.'
          );
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con Google';
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Servicio de autenticación no disponible. Verifica tus variables de Supabase.');
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' 
            ? 'Credenciales inválidas. Revisa tu correo y contraseña.' 
            : error.message);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          onAuthSuccess(data.user.email || email.trim());
          onClose();
        }
      } else {
        // Sign up
        if (!fullName.trim()) {
          setErrorMsg('Por favor ingresa tu nombre completo.');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              // La organización y el rol se resuelven exclusivamente en el
              // trigger de Supabase a partir de una invitación válida.
              invite_code: inviteCode.trim()
            }
          }
        });

        if (error) {
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }

        if (data.session) {
          onAuthSuccess(email.trim());
          onClose();
        } else {
          setInfoMsg('¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu registro.');
          setIsLoading(false);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-indigo-50/50 to-white border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                {mode === 'signin' ? 'Acceso a PactaCloud' : 'Crear Cuenta Institucional'}
              </h3>
              <p className="text-xs text-slate-500">
                Aislamiento estricto de datos con Supabase Auth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`flex-1 py-3 border-b-2 transition-colors cursor-pointer text-center ${
              mode === 'signin'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`flex-1 py-3 border-b-2 transition-colors cursor-pointer text-center ${
              mode === 'signup'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrarse
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mensajes de Alerta */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Botón de Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="text-[11px] font-semibold text-slate-400">o con tu correo</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Carmen Gloria Valenzuela"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Correo Institucional:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rectoria@colegio.cl"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Contraseña:</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Código de invitación:</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código entregado por tu administrador"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <p className="mt-1 text-[10px] text-slate-500">El código determina de forma segura tu organización y permisos iniciales.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1"
            >
              <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
                {isLoading ? 'progress_activity' : mode === 'signin' ? 'login' : 'how_to_reg'}
              </span>
              <span>
                {isLoading
                  ? 'Verificando...'
                  : mode === 'signin'
                  ? 'Entrar a mi Cuenta'
                  : 'Crear mi Cuenta'}
              </span>
            </button>
          </form>

          {/* Offline / Demo option */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium hover:underline cursor-pointer"
            >
              Continuar en Modo Demostración Local (Sin nube) &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
