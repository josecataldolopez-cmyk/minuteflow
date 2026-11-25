import { MeetingMinute, Organization } from '../types';

export interface GoogleOAuthSession {
  connected: boolean;
  email: string;
  accessToken?: string;
  expiresAt?: number;
  folderId?: string;
  connectedAt?: string;
}

const CLIENT_ID_STORAGE_KEY = 'minuteflow_google_client_id';
// Los access tokens sólo viven durante la pestaña actual. Persistirlos en
// localStorage permitiría que cualquier XSS los exfiltrara incluso después de
// cerrar sesión o recargar la aplicación.
const oauthSessions = new Map<string, GoogleOAuthSession>();

// Obtiene el Client ID de Google configurado (desde .env o desde configuración personalizada)
export function getGoogleClientId(): string {
  const custom = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (custom && custom.trim()) return custom.trim();
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
}

export function setGoogleClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
}

export function getStoredOAuthSession(orgId: string): GoogleOAuthSession | null {
  if (!orgId) return null;
  return oauthSessions.get(orgId) || null;
}

export function saveOAuthSession(orgId: string, session: GoogleOAuthSession): void {
  oauthSessions.set(orgId, session);
}

export function clearOAuthSession(orgId: string): void {
  oauthSessions.delete(orgId);
}

export function isDriveOAuthConnected(orgId: string): boolean {
  const session = getStoredOAuthSession(orgId);
  return Boolean(session?.connected && session?.email);
}

export function getDriveOAuthAccount(orgId: string): string | null {
  const session = getStoredOAuthSession(orgId);
  return session?.connected ? session.email : null;
}

/**
 * Inicia el flujo de autorización OAuth 2.0 con Google Identity Services (GIS).
 * Si no hay Client ID registrado, permite vincular en modo instantáneo para pruebas.
 */
export async function connectGoogleDriveOAuth(
  orgId: string,
  preferredEmail?: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  const clientId = getGoogleClientId();

  // Caso 1: Se tiene Google Client ID configurado y cargada la librería de Google GIS
  if (clientId && (window as any).google?.accounts?.oauth2) {
    return new Promise((resolve) => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
          hint: preferredEmail || undefined,
          callback: async (response: any) => {
            if (response.error) {
              resolve({
                success: false,
                error: `Error de Google: ${response.error_description || response.error}`
              });
              return;
            }

            const token = response.access_token;
            const expiresIn = response.expires_in || 3600;
            const expiresAt = Date.now() + expiresIn * 1000;

            // Consultar email del usuario autenticado en Google
            let detectedEmail = preferredEmail || '';
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
                signal: AbortSignal.timeout(10000)
              });
              if (userInfoRes.ok) {
                const info = await userInfoRes.json();
                if (info.email) detectedEmail = info.email;
              }
            } catch (err) {
              console.warn('No se pudo obtener userinfo directo:', err);
            }

            const session: GoogleOAuthSession = {
              connected: true,
              email: detectedEmail,
              accessToken: token,
              expiresAt,
              connectedAt: new Date().toISOString()
            };

            saveOAuthSession(orgId, session);
            resolve({ success: true, email: detectedEmail });
          }
        });

        client.requestAccessToken();
      } catch (err: any) {
        resolve({
          success: false,
          error: `Error al abrir ventana de Google: ${err.message || err}`
        });
      }
    });
  }

  // Caso 2: Sin Google Client ID configurado — no se puede autorizar de verdad.
  // Se devuelve un error explícito en lugar de simular una conexión falsa.
  return {
    success: false,
    error: 'Google Drive no está configurado. Define VITE_GOOGLE_CLIENT_ID (o regístralo en Configuración > Google Drive) para autorizar tu cuenta real.'
  };
}

/**
 * Busca o crea una carpeta o subcarpeta en Google Drive usando la API REST v3.
 * Si se pasa parentFolderId, busca o crea la carpeta como subcarpeta dentro de ella.
 */
export async function getOrCreateDriveFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; url: string } | null> {
  if (!token || token.startsWith('mock_oauth_')) {
    const mockId = `mock_folder_${folderName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    return {
      id: mockId,
      url: `https://drive.google.com/drive/u/0/my-drive`
    };
  }

  try {
    // 1. Buscar si la carpeta ya existe en Google Drive
    const cleanName = folderName.replace(/'/g, "\\'");
    let q = `name='${cleanName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentFolderId && !parentFolderId.startsWith('mock_')) {
      q += ` and '${parentFolderId}' in parents`;
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000)
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          url: data.files[0].webViewLink || `https://drive.google.com/drive/folders/${data.files[0].id}`
        };
      }
    }

    // 2. Si no existe, crear la carpeta en Google Drive
    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentFolderId && !parentFolderId.startsWith('mock_')) {
      metadata.parents = [parentFolderId];
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify(metadata)
    });

    if (createRes.ok) {
      const created = await createRes.json();
      return {
        id: created.id,
        url: `https://drive.google.com/drive/folders/${created.id}`
      };
    }
  } catch (err) {
    console.warn('Error al buscar/crear carpeta en Google Drive:', err);
  }

  return null;
}

/**
 * Crea una nueva subcarpeta en Google Drive para una organización específica.
 */
export async function createDriveSubfolder(
  orgId: string,
  subfolderName: string,
  orgName: string = 'Organización'
): Promise<{ success: boolean; folderId?: string; folderUrl?: string; message: string }> {
  const cleanSubfolder = subfolderName.trim();
  if (!cleanSubfolder) {
    return { success: false, message: 'El nombre de la subcarpeta no puede estar vacío.' };
  }

  const session = getStoredOAuthSession(orgId);
  const token = session?.accessToken;
  const isRealOAuth = session?.connected && token && !token.startsWith('mock_oauth_');

  // Caso 1: Token Real de Google OAuth 2.0
  if (isRealOAuth && token) {
    const rootFolderName = `PactaCloud - Actas Oficiales (${orgName})`;
    const rootFolder = await getOrCreateDriveFolder(token, rootFolderName);
    const rootId = rootFolder?.id;
    const subFolder = await getOrCreateDriveFolder(token, cleanSubfolder, rootId);

    if (subFolder) {
      return {
        success: true,
        folderId: subFolder.id,
        folderUrl: subFolder.url,
        message: `Subcarpeta "${cleanSubfolder}" creada exitosamente en tu Google Drive.`
      };
    }
  }

  // Caso 2: Webhook de Google Apps Script vinculado
  const webhookUrl = localStorage.getItem(`minuteflow_drive_webhook_${orgId}`) ||
    localStorage.getItem('minuteflow_drive_webhook_url') ||
    (import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL as string) || '';

  if (webhookUrl && webhookUrl.trim().startsWith('https://script.google.com')) {
    try {
      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          secret: sessionStorage.getItem(`minuteflow_drive_webhook_secret_${orgId}`) ||
            sessionStorage.getItem('minuteflow_drive_webhook_secret') || '',
          action: 'create_folder',
          folderName: cleanSubfolder,
          organizationId: orgId,
          organizationName: orgName
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          return {
            success: true,
            folderId: json.folderId,
            folderUrl: json.folderUrl,
            message: json.message || `Carpeta "${cleanSubfolder}" creada exitosamente en Google Drive.`
          };
        }
        return {
          success: false,
          message: json.message || 'Error reportado por Google Apps Script.'
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de comunicación';
      return {
        success: false,
        message: `Fallo al crear la carpeta en Google Drive mediante Webhook: ${msg}`
      };
    }
  }

  // Si no hay OAuth real ni Webhook configurado
  return {
    success: false,
    message: 'Para crear carpetas en tu Google Drive real, vincula tu Webhook de Google Apps Script o tu Client ID en Configuración > Google Drive.'
  };
}

/**
 * Elimina o mueve a la papelera una carpeta en Google Drive.
 */
export async function deleteDriveFolder(
  orgId: string,
  folderId: string
): Promise<{ success: boolean; message: string }> {
  const session = getStoredOAuthSession(orgId);
  if (!session || !session.accessToken || session.accessToken.startsWith('mock_')) {
    return { success: true, message: 'Carpeta desvinculada del espacio de Google Drive.' };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.accessToken}` },
      signal: AbortSignal.timeout(15000)
    });
    if (res.ok) {
      return { success: true, message: 'Carpeta eliminada de Google Drive.' };
    }
  } catch (err) {
    console.warn('Error eliminando carpeta en Drive:', err);
  }

  return { success: true, message: 'Carpeta removida del sistema.' };
}

/**
 * Sube o crea el acta oficial directamente en la subcarpeta seleccionada de Google Drive.
 */
export async function uploadMinuteViaOAuth(
  minute: MeetingMinute,
  organization?: Organization,
  customSubfolderName?: string
): Promise<{ success: boolean; message: string; fileUrl?: string; folderName?: string; folderUrl?: string }> {
  const orgId = minute.organizationId || organization?.id || 'org-redq';
  const orgName = organization?.name || 'Organización';
  const session = getStoredOAuthSession(orgId);

  if (!session || !session.connected) {
    return {
      success: false,
      message: 'Google Drive no está conectado. Haz clic en "Conectar con Google Drive" para autorizar tu cuenta.'
    };
  }

  const subfolderName = customSubfolderName?.trim() || minute.directory || 'Actas Generales';
  const token = session.accessToken;
  const isRealToken = token && !token.startsWith('mock_oauth_');

  // Si la sesión ha expirado
  if (session.expiresAt && session.expiresAt <= Date.now()) {
    return {
      success: false,
      message: `La sesión de Google Drive para ${session.email} ha expirado. Por favor haz clic en "Conectar con Google Drive" para renovar la autorización.`,
      folderName: `PactaCloud / ${orgName} / ${subfolderName}`
    };
  }

  // Si tenemos token real de OAuth 2.0 y está vigente
  if (isRealToken && session.expiresAt && session.expiresAt > Date.now()) {
    const rootFolderName = `PactaCloud - Actas Oficiales (${orgName})`;
    try {
      // 1. Obtener o crear carpeta raíz de la organización
      const rootFolder = await getOrCreateDriveFolder(token, rootFolderName);

      // 2. Obtener o crear la subcarpeta correspondiente
      const subFolder = await getOrCreateDriveFolder(token, subfolderName, rootFolder?.id);

      // 3. Crear documento en Google Docs DENTRO de la subcarpeta (parents: [subFolder.id])
      const metadata: any = {
        name: `Acta - ${minute.title} (${minute.date})`,
        mimeType: 'application/vnd.google-apps.document',
        description: `Acta oficial de ${orgName}. Guardada en subcarpeta "${subfolderName}".`
      };

      if (subFolder?.id) {
        metadata.parents = [subFolder.id];
      }

      const htmlContent = generateMinuteHTML(minute, organization);

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        htmlContent +
        closeDelim;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        signal: AbortSignal.timeout(25000),
        body: multipartRequestBody
      });

      if (res.ok) {
        const file = await res.json();
        const docUrl = `https://docs.google.com/document/d/${file.id}/edit`;
        return {
          success: true,
          message: `Acta guardada exitosamente en la subcarpeta "${subfolderName}" de ${session.email}`,
          fileUrl: docUrl,
          folderUrl: subFolder?.url,
          folderName: `${rootFolderName} / ${subfolderName}`
        };
      }

      // Si Google Drive API respondió con código de error
      const errorText = await res.text();
      console.error('Google Drive API error response:', res.status, errorText);
      return {
        success: false,
        message: res.status === 401
          ? `Sesión expirada o no autorizada para ${session.email}. Por favor reconecta tu cuenta.`
          : `Error al crear el Google Doc (HTTP ${res.status}). Por favor reintenta.`,
        folderName: `${rootFolderName} / ${subfolderName}`
      };
    } catch (err: unknown) {
      const errDetail = err instanceof Error ? err.message : 'Error de comunicación';
      console.warn('Error en llamada a Google Drive API:', err);
      return {
        success: false,
        message: `Fallo de comunicación con Google Drive: ${errDetail}. Por favor verifica tu red.`,
        folderName: `${rootFolderName} / ${subfolderName}`
      };
    }
  }

  return {
    success: false,
    message: `No hay una sesión activa de Google Drive para ${orgName}. Conecta tu cuenta oficial con 1 Clic para exportar.`,
    folderName: `PactaCloud / ${orgName} / ${subfolderName}`
  };
}

/**
 * Función centralizada para escapar caracteres HTML y prevenir XSS en exportación
 */
function escapeHtml(str?: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Genera el documento HTML enriquecido con membrete, logo y estructura oficial
 * para que Google Drive lo convierta automáticamente en un Google Doc profesional.
 */
export function generateMinuteHTML(minute: MeetingMinute, organization?: Organization): string {
  const orgName = escapeHtml(organization?.name || 'PactaCloud');
  const slogan = escapeHtml(organization?.slogan || '');
  const headerText = escapeHtml(organization?.headerText || 'DOCUMENTO OFICIAL DE REUNIÓN');
  const taxId = escapeHtml(organization?.taxId || '');
  const address = escapeHtml(organization?.address || '');
  const primaryColor = organization?.primaryColor || '#4f46e5';

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(minute.title)} - ${orgName}</title>
        <style>
          @page { size: auto; margin: 18mm 16mm; }
          body { font-family: 'Arial', 'Helvetica Neue', sans-serif; color: #1e293b; line-height: 1.6; padding: 20px; max-width: 820px; margin: 0 auto; }
          .header { border-bottom: 3px solid ${primaryColor}; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
          .inst-title { font-size: 18px; font-weight: bold; color: ${primaryColor}; margin: 0; text-transform: uppercase; }
          .inst-slogan { font-size: 12px; color: #64748b; font-style: italic; margin-top: 2px; }
          .inst-header { font-size: 11px; font-weight: bold; color: #475569; letter-spacing: 1px; margin-bottom: 4px; }
          .inst-meta { font-size: 11px; color: #64748b; text-align: right; }
          h1 { font-size: 22px; color: #0f172a; margin-top: 15px; margin-bottom: 12px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #f8fafc; }
          .meta-table td { padding: 8px 12px; font-size: 12px; border: 1px solid #e2e8f0; }
          .label { font-weight: bold; color: #475569; width: 25%; }
          .section-title { font-size: 14px; font-weight: bold; color: ${primaryColor}; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 22px; page-break-after: avoid; }
          .content-box { font-size: 13px; line-height: 1.7; white-space: pre-line; margin-top: 8px; }
          .actions-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          .actions-table th { background: ${primaryColor}; color: white; padding: 8px; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .actions-table td { padding: 8px; border: 1px solid #e2e8f0; }
          .signatures { margin-top: 48px; display: flex; justify-content: space-between; gap: 40px; page-break-inside: avoid; }
          .sig-box { flex: 1; text-align: center; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 11px; color: #475569; }
          .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="inst-header">${headerText}</div>
            <div class="inst-title">${orgName}</div>
            ${slogan ? `<div class="inst-slogan">"${slogan}"</div>` : ''}
          </div>
          ${(taxId || address) ? `
            <div class="inst-meta">
              ${taxId ? `<div>RUT / ID: ${taxId}</div>` : ''}
              ${address ? `<div>${address}</div>` : ''}
            </div>
          ` : ''}
        </div>

        <h1>${escapeHtml(minute.title)}</h1>

        <table class="meta-table">
          <tr>
            <td class="label">Fecha y Hora:</td>
            <td>${escapeHtml(minute.date)} a las ${escapeHtml(minute.time || '10:00')}</td>
            <td class="label">Carpeta / Directorio:</td>
            <td>${escapeHtml(minute.directory)}</td>
          </tr>
          <tr>
            <td class="label">Estado del Acta:</td>
            <td><strong>${escapeHtml(minute.status)}</strong></td>
            <td class="label">Próxima Sesión:</td>
            <td>${escapeHtml(minute.nextSessionDate || 'Por programar')}</td>
          </tr>
        </table>

        ${minute.objectives ? `
          <div class="section-title">Objetivo de la Reunión</div>
          <div class="content-box">${escapeHtml(minute.objectives)}</div>
        ` : ''}

        <div class="section-title">Puntos Tratados y Acuerdos</div>
        <div class="content-box">${escapeHtml(minute.pointsTreated)}</div>

        ${minute.attendees && minute.attendees.length > 0 ? `
          <div class="section-title">Asistentes y Participantes (${minute.attendees.length})</div>
          <ul>
            ${minute.attendees.map(a => `<li><strong>${escapeHtml(a.name)}</strong> - ${escapeHtml(a.role || 'Miembro')} (${escapeHtml(a.email)})</li>`).join('')}
          </ul>
        ` : ''}

        ${minute.actionItems && minute.actionItems.length > 0 ? `
          <div class="section-title">Compromisos y Tareas Asignadas (${minute.actionItems.length})</div>
          <table class="actions-table">
            <thead>
              <tr>
                <th>Compromiso / Acción</th>
                <th>Responsable</th>
                <th>Vencimiento</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${minute.actionItems.map(act => `
                <tr>
                  <td>${escapeHtml(act.text)}</td>
                  <td>${escapeHtml(act.assignedTo?.name || 'Equipo')}</td>
                  <td>${escapeHtml(act.dueDate || 'Pendiente')}</td>
                  <td>${act.completed ? 'Completado' : 'Pendiente'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">
            <strong>Dirección / Presidencia</strong><br/>
            ${orgName}
          </div>
          <div class="sig-box">
            <strong>Secretaría de Actas</strong><br/>
            Validación Institucional
          </div>
        </div>

        <div class="footer">
          Acta oficial generada por PactaCloud Suite para ${orgName}.
        </div>
      </body>
    </html>
  `;
}
