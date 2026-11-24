import React, { useEffect, useState } from 'react';
import { InviteRole, OrganizationInvite, createOrganizationInvite, listOrganizationInvites } from '../../services/inviteService';

interface InvitationManagementTabProps {
  isAdmin: boolean;
  orgName: string;
  onShowToast: (message: string) => void;
}

const ROLE_LABELS: Record<InviteRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  reader: 'Lector'
};

export const InvitationManagementTab: React.FC<InvitationManagementTabProps> = ({ isAdmin, orgName, onShowToast }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('editor');
  const [days, setDays] = useState(7);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const loadInvites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setInvites(await listOrganizationInvites());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las invitaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void loadInvites();
  }, [isAdmin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Ingresa un correo válido o deja el campo vacío para generar un código general.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setCreatedCode(null);
    try {
      const invite = await createOrganizationInvite(cleanEmail, role, days);
      setCreatedCode(invite.invitation_code);
      setEmail('');
      await loadInvites();
      onShowToast('Invitación creada. Copia el código antes de cerrar esta pantalla.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la invitación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      onShowToast('Código de invitación copiado.');
    } catch {
      setError('No se pudo copiar automáticamente. Selecciona y copia el código manualmente.');
    }
  };

  if (!isAdmin) return null;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" aria-labelledby="invites-title">
      <div className="p-5 md:p-6 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="invites-title" className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600" aria-hidden="true">group_add</span>
            Invitaciones institucionales
          </h2>
          <p className="text-xs text-slate-500 mt-1">Entrega acceso a {orgName} sin exponer roles ni organizaciones en el registro.</p>
        </div>
        <button type="button" onClick={() => void loadInvites()} disabled={isLoading} className="min-h-10 px-3 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          Actualizar
        </button>
      </div>

      <div className="p-5 md:p-6 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}
          <div>
            <label htmlFor="invite-email" className="block mb-1 text-xs font-bold text-slate-700">Correo del invitado <span className="font-medium text-slate-400">(opcional)</span></label>
            <input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setError(null)} placeholder="persona@institucion.cl" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="invite-role" className="block mb-1 text-xs font-bold text-slate-700">Rol inicial</label>
              <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as InviteRole)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="invite-days" className="block mb-1 text-xs font-bold text-slate-700">Vigencia</label>
              <select id="invite-days" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={1}>1 día</option><option value={7}>7 días</option><option value={14}>14 días</option><option value={30}>30 días</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full min-h-11 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? 'Creando invitación…' : 'Crear código seguro'}
          </button>
          {createdCode && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[11px] font-bold text-amber-900">Código generado — se muestra sólo ahora</p><div className="mt-2 flex gap-2"><code className="min-w-0 flex-1 break-all rounded-lg bg-white px-2 py-2 text-[11px] text-slate-800 border border-amber-200">{createdCode}</code><button type="button" onClick={() => void copyCode()} className="rounded-lg border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900 hover:bg-amber-100">Copiar</button></div></div>}
        </form>

        <div className="min-w-0">
          <h3 className="text-xs font-extrabold text-slate-800 mb-3">Invitaciones recientes</h3>
          {isLoading ? <p className="text-xs text-slate-500">Cargando invitaciones…</p> : invites.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Aún no hay invitaciones activas o históricas.</p> : <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {invites.map((invite) => {
              const used = Boolean(invite.accepted_at);
              const expired = !used && new Date(invite.expires_at).getTime() <= Date.now();
              return <li key={invite.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{invite.email || 'Código sin correo asignado'}</p><p className="mt-0.5 text-[11px] text-slate-500">{ROLE_LABELS[invite.role]} · vence {new Date(invite.expires_at).toLocaleDateString('es-CL')}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${used ? 'bg-emerald-50 text-emerald-700' : expired ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-700'}`}>{used ? 'Usada' : expired ? 'Expirada' : 'Pendiente'}</span></div></li>;
            })}
          </ul>}
        </div>
      </div>
    </section>
  );
};
