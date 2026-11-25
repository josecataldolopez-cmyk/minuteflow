import React, { useState } from 'react';
import { Organization } from '../types';
import { storageService } from '../services/storageService';

interface InstitutionOnboardingModalProps {
  isOpen: boolean;
  userEmail: string;
  onComplete: (org: Organization) => void;
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#dc2626', // Rose
  '#0f172a', // Slate
];

export const InstitutionOnboardingModal: React.FC<InstitutionOnboardingModalProps> = ({
  isOpen,
  userEmail,
  onComplete,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [slogan, setSlogan] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa el nombre de tu institución o empresa.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    const derivedCode =
      code.trim().toUpperCase() ||
      name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 4)
        .toUpperCase();

    const res = await storageService.createMyOrganizationOnboarding({
      name: name.trim(),
      code: derivedCode,
      taxId: taxId.trim(),
      address: address.trim(),
      slogan: slogan.trim(),
      primaryColor,
    });

    setIsSubmitting(false);

    if (!res.success || !res.organization) {
      setErrorMsg(res.error || 'No se pudo registrar la institución. Reintenta nuevamente.');
      return;
    }

    onComplete(res.organization);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-org-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-indigo-50/70 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-sm font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[24px]">domain_add</span>
            </div>
            <div>
              <h2 id="onboarding-org-title" className="font-extrabold text-slate-900 text-lg tracking-tight">
                Configura tu Institución
              </h2>
              <p className="text-xs text-slate-600">
                Bienvenido ({userEmail}). Crea tu espacio de trabajo limpio desde cero.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="onb-org-name" className="text-xs font-bold text-slate-700 block mb-1">
                Nombre de la Institución / Empresa *
              </label>
              <input
                id="onb-org-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Colegio Valle Verde"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="onb-org-code" className="text-xs font-bold text-slate-700 block mb-1">
                Sigla / Código
              </label>
              <input
                id="onb-org-code"
                type="text"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. CVV"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="onb-org-taxid" className="text-xs font-bold text-slate-700 block mb-1">
                RUT / ID Fiscal (opcional)
              </label>
              <input
                id="onb-org-taxid"
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Ej. 76.123.456-7"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="onb-org-address" className="text-xs font-bold text-slate-700 block mb-1">
                Dirección (opcional)
              </label>
              <input
                id="onb-org-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Av. Central 450"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="onb-org-slogan" className="text-xs font-bold text-slate-700 block mb-1">
              Lema o Subtítulo para Actas PDF (opcional)
            </label>
            <input
              id="onb-org-slogan"
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Ej. Excelencia y Gobernanza Institucional"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">Color Institucional</span>
            <div className="flex items-center gap-2.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPrimaryColor(color)}
                  aria-label={`Seleccionar color ${color}`}
                  aria-pressed={primaryColor === color}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                    primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Creando espacio de trabajo...</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  <span>Crear Institución y Comenzar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
