import React, { useState, useEffect } from 'react';
import { Organization } from '../../types';
import { COLOR_PRESETS, LOGO_PRESETS } from '../../constants/brandingPresets';

interface OrganizationBrandingTabProps {
  currentOrganization?: Organization;
  onUpdateOrganization?: (updatedOrg: Organization) => void;
  onShowToast: (msg: string) => void;
  isAdmin: boolean;
  compressImage: (file: File, maxDim?: number) => Promise<string>;
  hasMultipleOrgs?: boolean;
  onPurgeDemoOrganizations?: () => void;
}

export const OrganizationBrandingTab: React.FC<OrganizationBrandingTabProps> = ({
  currentOrganization,
  onUpdateOrganization,
  onShowToast,
  isAdmin,
  compressImage,
  hasMultipleOrgs = false,
  onPurgeDemoOrganizations
}) => {
  // Estados para datos institucionales / recinto
  const [orgName, setOrgName] = useState(currentOrganization?.name || 'Establecimiento Principal');
  const [orgCode, setOrgCode] = useState(currentOrganization?.code || 'INST-01');
  const [orgTaxId, setOrgTaxId] = useState(currentOrganization?.taxId || '');
  const [orgAddress, setOrgAddress] = useState(currentOrganization?.address || '');
  const [orgDomain, setOrgDomain] = useState(currentOrganization?.domain || '');
  const [orgDriveAccount, setOrgDriveAccount] = useState(currentOrganization?.driveAccount || '');
  
  // Estados para identidad visual y membretes
  const [orgPrimaryColor, setOrgPrimaryColor] = useState(
    currentOrganization?.primaryColor || '#4f46e5'
  );
  const [orgLogoUrl, setOrgLogoUrl] = useState(currentOrganization?.logoUrl || '');
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [orgSlogan, setOrgSlogan] = useState(currentOrganization?.slogan || '');
  const [orgHeaderText, setOrgHeaderText] = useState(
    currentOrganization?.headerText || 'DOCUMENTO OFICIAL DE REUNIÓN'
  );
  const [isEditing, setIsEditing] = useState(false);

  // Sincronizar estados cuando cambie currentOrganization
  useEffect(() => {
    if (currentOrganization) {
      setOrgName(currentOrganization.name || '');
      setOrgCode(currentOrganization.code || '');
      setOrgTaxId(currentOrganization.taxId || '');
      setOrgAddress(currentOrganization.address || '');
      setOrgDomain(currentOrganization.domain || '');
      setOrgDriveAccount(currentOrganization.driveAccount || '');
      setOrgPrimaryColor(currentOrganization.primaryColor || '#4f46e5');
      setOrgLogoUrl(currentOrganization.logoUrl || '');
      setOrgSlogan(currentOrganization.slogan || '');
      setOrgHeaderText(currentOrganization.headerText || 'DOCUMENTO OFICIAL DE REUNIÓN');
    }
  }, [currentOrganization]);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 256);
      if (compressed) {
        setOrgLogoUrl(compressed);
        setCustomLogoInput('');
        onShowToast('Logo institucional optimizado y cargado. Guarda los cambios para aplicar.');
      }
    } catch {
      onShowToast('No se pudo procesar la imagen seleccionada');
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization || !onUpdateOrganization) return;

    const trimmedName = orgName.trim() || currentOrganization.name;
    const finalLogo = customLogoInput.trim() || orgLogoUrl;

    const updated: Organization = {
      ...currentOrganization,
      name: trimmedName,
      code: orgCode.trim() || currentOrganization.code,
      taxId: orgTaxId.trim(),
      address: orgAddress.trim(),
      domain: orgDomain.trim(),
      driveAccount: orgDriveAccount.trim(),
      primaryColor: orgPrimaryColor,
      logoUrl: finalLogo,
      slogan: orgSlogan.trim(),
      headerText: orgHeaderText.trim()
    };

    onUpdateOrganization(updated);
    setIsEditing(false);
    onShowToast(`Datos de "${trimmedName}" actualizados correctamente`);
  };

  return (
    <div className="bento-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
      {/* Header del Bloque */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 overflow-hidden"
            style={{ backgroundColor: orgPrimaryColor }}
          >
            {orgLogoUrl ? (
              <img src={orgLogoUrl} alt={orgName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[26px]" aria-hidden="true">corporate_fare</span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>{orgName}</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                CÓD: {orgCode}
              </span>
              {orgTaxId && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  RUT: {orgTaxId}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {orgAddress ? (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                  {orgAddress}
                </span>
              ) : (
                'Configura los datos del establecimiento, recinto o institución, logotipo y membrete oficial.'
              )}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto border border-indigo-100 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              {isEditing ? 'close' : 'edit_square'}
            </span>
            <span>{isEditing ? 'Cancelar Edición' : 'Modificar Datos del Establecimiento'}</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveBranding} className="space-y-6 pt-1">
          {/* SECCIÓN 1: Datos Generales del Establecimiento / Recinto */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="material-symbols-outlined text-indigo-600 text-[20px]" aria-hidden="true">
                domain
              </span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Datos del Establecimiento, Institución o Recinto
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre Oficial del Establecimiento / Institución *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ej. Colegio San Ignacio, Hospital Clínico Central, RedQ S.A."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Código o Sigla del Establecimiento *
                </label>
                <input
                  type="text"
                  required
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  placeholder="Ej. CSI-01, HOSP-CENTRAL, REDQ"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  RUT o Identificador Fiscal
                </label>
                <input
                  type="text"
                  value={orgTaxId}
                  onChange={(e) => setOrgTaxId(e.target.value)}
                  placeholder="Ej. 76.890.123-K"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recinto, Campus o Dirección de la Sede
                </label>
                <input
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Ej. Sede Central, Av. Libertador Bernardo O'Higgins 1234"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dominio Web Institucional
                </label>
                <input
                  type="text"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  placeholder="Ej. redq.cl, colegiosanignacio.cl, pactacloud.cl"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cuenta Google Workspace / Drive Institucional
                </label>
                <input
                  type="email"
                  value={orgDriveAccount}
                  onChange={(e) => setOrgDriveAccount(e.target.value)}
                  placeholder="Ej. actas@miinstitucion.cl o tu.cuenta@gmail.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Membrete Oficial y Lema */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="material-symbols-outlined text-indigo-600 text-[20px]" aria-hidden="true">
                description
              </span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Membrete Oficial y Lema para Actas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lema o Slogan Institucional</label>
                <input
                  type="text"
                  value={orgSlogan}
                  onChange={(e) => setOrgSlogan(e.target.value)}
                  placeholder="Ej. Formando líderes con vocación y excelencia"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-2xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Membrete Oficial para Google Docs y Actas</label>
                <input
                  type="text"
                  value={orgHeaderText}
                  onChange={(e) => setOrgHeaderText(e.target.value)}
                  placeholder="Ej. COLEGIO SAN IGNACIO — CONSEJO DE DIRECCIÓN"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Logotipo del Establecimiento */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]" aria-hidden="true">image</span>
                Logo Oficial del Establecimiento
              </span>
              <span className="text-[10px] text-slate-400">Formatos: PNG, JPG, SVG, WebP (Optimizado auto)</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                {orgLogoUrl ? (
                  <img src={orgLogoUrl} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="material-symbols-outlined text-slate-300 text-[32px]" aria-hidden="true">apartment</span>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap gap-2">
                  <label className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600" aria-hidden="true">upload_file</span>
                    <span>Subir desde mi computador</span>
                    <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" />
                  </label>
                  {orgLogoUrl && (
                    <button
                      type="button"
                      onClick={() => { setOrgLogoUrl(''); setCustomLogoInput(''); }}
                      className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1 cursor-pointer font-medium"
                    >
                      Quitar logo
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={customLogoInput}
                  onChange={(e) => setCustomLogoInput(e.target.value)}
                  placeholder="O pega una URL directa de imagen (https://...)"
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">O elige un logotipo de referencia institucional:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LOGO_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => { setOrgLogoUrl(p.url); setCustomLogoInput(''); }}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 flex items-center gap-2 cursor-pointer transition-all text-left"
                  >
                    <img src={p.url} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    <span className="text-[11px] font-bold text-slate-700 truncate">{p.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Color Corporativo */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]" aria-hidden="true">colorize</span>
              Color Institucional Primario
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setOrgPrimaryColor(c.color)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                    orgPrimaryColor === c.color ? 'border-slate-900 bg-white shadow-xs ring-2 ring-indigo-200' : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-lg shrink-0 shadow-2xs" style={{ backgroundColor: c.color }} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{c.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>
              <span>Guardar Datos del Establecimiento</span>
            </button>
          </div>
        </form>
      ) : (
        /* VISTA INFORMATIVA (Bento Grid) */
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Establecimiento / Razón Social:</span>
              <p className="text-xs font-bold text-slate-800 truncate">{orgName}</p>
              <span className="text-[10px] text-slate-500">Cód: {orgCode}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">RUT / ID Tributario:</span>
              <p className="text-xs font-bold text-slate-800 truncate">{orgTaxId || 'No registrado'}</p>
              <span className="text-[10px] text-slate-500">{orgDomain || 'Sin dominio registrado'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Recinto o Sede:</span>
              <p className="text-xs font-bold text-slate-800 truncate">{orgAddress || 'Sede Principal'}</p>
              <span className="text-[10px] text-slate-500">Ubicación para actas</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Google Drive Asociado:</span>
              <p className="text-xs font-bold text-slate-800 truncate">{orgDriveAccount || 'Sin vincular'}</p>
              <span className="text-[10px] text-slate-500">Destino de actas oficiales</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Color Oficial:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-4 h-4 rounded-full shadow-2xs shrink-0" style={{ backgroundColor: orgPrimaryColor }} />
                <span className="text-xs font-bold text-slate-800">{orgPrimaryColor}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Lema Institucional:</span>
              <p className="text-xs font-bold text-slate-800 truncate">{orgSlogan || 'Sin lema configurado'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Membrete en Documentos y Actas:</span>
              <p className="text-xs font-bold text-slate-800 truncate">{orgHeaderText || 'DOCUMENTO OFICIAL'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Aislamiento Exclusivo si aún existen organizaciones demo */}
      {hasMultipleOrgs && onPurgeDemoOrganizations && isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0 mt-0.5" aria-hidden="true">
              security
            </span>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Aislar cuenta: Conservar únicamente mi establecimiento
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Actualmente tu sesión tiene cargados otros establecimientos de demostración inicial. Al pulsar este botón se eliminarán todas las organizaciones de prueba, dejando tu cuenta vinculada de forma exclusiva a <strong>{orgName}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onPurgeDemoOrganizations}
            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-300 px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete_sweep</span>
            <span>Eliminar Establecimientos Demo</span>
          </button>
        </div>
      )}
    </div>
  );
};
