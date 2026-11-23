import { MeetingMinute, Organization } from '../types';
import {
  isDriveOAuthConnected,
  getDriveOAuthAccount,
  uploadMinuteViaOAuth
} from './googleDriveOAuthService';

const GLOBAL_STORAGE_KEY = 'minuteflow_drive_webhook_url';
const DEFAULT_ACCOUNT = 'jose.cataldo@redq.cl';

/**
 * Valida de forma estricta que la URL provenga del dominio oficial de Google Apps Script.
 * Previene vulnerabilidades SSRF, inyección de scripts y redirecciones maliciosas.
 */
export function validateDriveWebhookUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'La URL no puede estar vacía' };
  }

  const trimmed = url.trim();

  // Debe usar HTTPS obligatorio
  if (!trimmed.startsWith('https://')) {
    return { isValid: false, error: 'La URL debe usar el protocolo seguro HTTPS (https://)' };
  }

  try {
    const parsed = new URL(trimmed);

    // Debe ser estrictamente el host de Google Apps Script
    if (parsed.hostname !== 'script.google.com') {
      return {
        isValid: false,
        error: 'Por seguridad, la URL debe pertenecer exclusivamente al dominio oficial script.google.com'
      };
    }

    // Debe contener la ruta de ejecución de macros (/macros/s/.../exec)
    if (!parsed.pathname.includes('/macros/s/') || !parsed.pathname.endsWith('/exec')) {
      return {
        isValid: false,
        error: 'La URL debe terminar en /exec y corresponder a una Aplicación Web publicada de Google Apps Script'
      };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'El formato de la URL no es válido' };
  }
}

/**
 * Obtiene la URL del webhook de Google Drive para una organización específica.
 */
export function getOrgDriveWebhookUrl(orgId: string): string {
  if (!orgId) return getDriveWebhookUrl();
  const saved = localStorage.getItem(`minuteflow_drive_webhook_${orgId}`);
  if (saved && saved.trim()) return saved.trim();

  // Fallback a variable de entorno o configuración global si coincide
  const globalSaved = localStorage.getItem(GLOBAL_STORAGE_KEY);
  if (globalSaved && globalSaved.trim()) return globalSaved.trim();

  return (import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL as string) || '';
}

/**
 * Guarda la URL del webhook de Google Drive para una organización específica.
 */
export function setOrgDriveWebhookUrl(orgId: string, url: string): void {
  const clean = url.trim();
  if (orgId) {
    localStorage.setItem(`minuteflow_drive_webhook_${orgId}`, clean);
  }
  localStorage.setItem(GLOBAL_STORAGE_KEY, clean);
}

/**
 * Obtiene la cuenta corporativa de Google Drive para una organización.
 */
export function getOrgDriveAccount(orgId: string, defaultAccount?: string): string {
  if (orgId) {
    const saved = localStorage.getItem(`minuteflow_drive_account_${orgId}`);
    if (saved && saved.trim()) return saved.trim();
  }
  return defaultAccount || localStorage.getItem('minuteflow_drive_account') || DEFAULT_ACCOUNT;
}

/**
 * Guarda la cuenta corporativa de Google Drive para una organización.
 */
export function setOrgDriveAccount(orgId: string, account: string): void {
  const clean = account.trim();
  if (orgId) {
    localStorage.setItem(`minuteflow_drive_account_${orgId}`, clean);
  }
  localStorage.setItem('minuteflow_drive_account', clean);
}

// Compatibilidad con código previo
export function getDriveWebhookUrl(): string {
  const saved = localStorage.getItem(GLOBAL_STORAGE_KEY);
  if (saved && saved.trim()) return saved.trim();
  return (import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL as string) || '';
}

export function setDriveWebhookUrl(url: string): void {
  localStorage.setItem(GLOBAL_STORAGE_KEY, url.trim());
}

export function getDriveAccount(): string {
  return localStorage.getItem('minuteflow_drive_account') || DEFAULT_ACCOUNT;
}

export function setDriveAccount(account: string): void {
  localStorage.setItem('minuteflow_drive_account', account.trim());
}

export interface DriveSyncResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
  folderName?: string;
  organizationName?: string;
}

/**
 * Envía el acta estructurada al Webhook de Google Apps Script configurado
 * específicamente por el administrador de la organización.
 */
export async function syncMinuteToGoogleDrive(
  minute: MeetingMinute,
  authorName?: string,
  organization?: Organization,
  customSubfolderName?: string
): Promise<DriveSyncResponse> {
  const orgId = minute.organizationId || organization?.id || 'org-primary';
  const orgName = organization?.name || 'Organización';
  const webhookUrl = organization?.driveWebhookUrl || getOrgDriveWebhookUrl(orgId);
  const targetAccount = organization?.driveAccount || getOrgDriveAccount(orgId);
  const subfolder = customSubfolderName?.trim() || minute.directory || 'Actas Generales';

  // 1. Método Preferido: Conexión con 1 Clic (Google OAuth 2.0 Oficial)
  if (isDriveOAuthConnected(orgId)) {
    const oauthRes = await uploadMinuteViaOAuth(minute, organization, subfolder);
    return {
      success: oauthRes.success,
      message: oauthRes.message,
      fileUrl: oauthRes.fileUrl,
      folderName: oauthRes.folderName,
      organizationName: orgName
    };
  }

  // 2. Si no hay OAuth ni Webhook configurado
  if (!webhookUrl) {
    return {
      success: false,
      message: `No hay conexión activa con Google Drive para ${orgName}. Por favor conecta tu cuenta institucional en 1 Clic o vincula un Webhook.`,
      organizationName: orgName
    };
  }

  // Validación de seguridad previa al envío
  const validation = validateDriveWebhookUrl(webhookUrl);
  if (!validation.isValid) {
    return {
      success: false,
      message: `Error de seguridad: ${validation.error}`,
      organizationName: orgName
    };
  }

  const payload = {
    id: minute.id,
    title: minute.title,
    directory: minute.directory,
    date: minute.date,
    time: minute.time,
    status: minute.status,
    objectives: minute.objectives,
    pointsTreated: minute.pointsTreated,
    attendees: minute.attendees,
    actionItems: minute.actionItems,
    nextSessionDate: minute.nextSessionDate,
    author: authorName || 'Dirección Ejecutiva',
    organizationId: orgId,
    organizationName: orgName
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      try {
        const json = await response.json();
        if (json.status === 'success') {
          return {
            success: true,
            message: `Guardado exitosamente en Google Drive de ${orgName} (${json.folderName || minute.directory})`,
            fileUrl: json.fileUrl,
            folderName: json.folderName,
            organizationName: orgName
          };
        }
      } catch {
        return {
          success: true,
          message: `Acta transmitida exitosamente al Google Drive de ${orgName} (${minute.directory})`,
          fileUrl: `https://drive.google.com/drive/u/0/my-drive`,
          organizationName: orgName
        };
      }
    }

    return {
      success: false,
      message: `El servidor de Google Apps Script respondió con código HTTP ${response.status} (${response.statusText || 'Petición no completada'}).`,
      organizationName: orgName
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error de comunicación';
    console.error('Error sincronizando con Google Drive:', error);
    return {
      success: false,
      message: `Fallo de comunicación con Google Drive: ${errorMsg}. Por favor verifica tu conexión o reintenta.`,
      organizationName: orgName
    };
  }
}

/**
 * Crea una carpeta física real en Google Drive mediante el Webhook de Google Apps Script.
 */
export async function createDriveFolderViaWebhook(
  orgId: string,
  folderName: string,
  organizationName?: string
): Promise<{ success: boolean; message: string; folderUrl?: string; folderId?: string }> {
  const webhookUrl = getOrgDriveWebhookUrl(orgId);
  if (!webhookUrl) {
    return {
      success: false,
      message: 'No hay Webhook de Google Apps Script configurado. Configura tu Webhook en Configuración > Google Drive.'
    };
  }

  const validation = validateDriveWebhookUrl(webhookUrl);
  if (!validation.isValid) {
    return {
      success: false,
      message: `URL de Webhook inválida: ${validation.error}`
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        action: 'create_folder',
        folderName: folderName.trim(),
        organizationId: orgId,
        organizationName: organizationName || 'Establecimiento'
      })
    });

    if (response.ok) {
      const json = await response.json();
      if (json.status === 'success') {
        return {
          success: true,
          message: json.message || `Carpeta "${folderName}" creada exitosamente en Google Drive.`,
          folderUrl: json.folderUrl,
          folderId: json.folderId
        };
      }
      return {
        success: false,
        message: json.message || 'El Webhook reportó un error al crear la carpeta.'
      };
    }

    return {
      success: false,
      message: `Google Apps Script respondió con código HTTP ${response.status}.`
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de red';
    return {
      success: false,
      message: `No se pudo comunicar con Google Apps Script: ${msg}`
    };
  }
}

/**
 * Prueba la conexión con el Webhook de Google Apps Script.
 */
export async function testDriveWebhook(
  orgId: string,
  organizationName?: string
): Promise<{ success: boolean; message: string; folderUrl?: string }> {
  const webhookUrl = getOrgDriveWebhookUrl(orgId);
  if (!webhookUrl) {
    return {
      success: false,
      message: 'Ingresa la URL del Webhook de Google Apps Script para probar la conexión.'
    };
  }

  const validation = validateDriveWebhookUrl(webhookUrl);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error || 'URL inválida'
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        action: 'test',
        organizationId: orgId,
        organizationName: organizationName || 'Establecimiento'
      })
    });

    if (response.ok) {
      const json = await response.json();
      if (json.status === 'success') {
        return {
          success: true,
          message: json.message || 'Conexión exitosa y verificada con Google Drive.',
          folderUrl: json.folderUrl
        };
      }
      return {
        success: false,
        message: json.message || 'El Webhook no confirmó la conexión.'
      };
    }

    return {
      success: false,
      message: `El servidor de Google Apps Script respondió con error (HTTP ${response.status}).`
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de conexión';
    return {
      success: false,
      message: `Error al conectar con el Webhook: ${msg}. Verifica que el script esté publicado con acceso "Cualquier usuario" (Anyone).`
    };
  }
}

export const APPS_SCRIPT_TEMPLATE = `/**
 * PACTACLOUD - GOOGLE APPS SCRIPT WEBHOOK PARA GOOGLE DRIVE
 * 1. Entra a https://script.google.com con tu cuenta del colegio/institución.
 * 2. Nuevo proyecto > Pega este código.
 * 3. Implementar > Nueva implementación > Tipo: "Aplicación web".
 * 4. Ejecutar como: "Yo" | Quién tiene acceso: "Cualquier usuario" (Anyone).
 * 5. Copia la URL (termina en /exec) y pégala en PactaCloud.
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "online", message: "PactaCloud Drive Sync Activo" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : null;
    if (!raw) return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sin datos" })).setMimeType(ContentService.MimeType.JSON);
    var data = JSON.parse(raw);
    var orgName = data.organizationName || "Establecimiento";
    var rootFolderName = "PactaCloud - Actas Oficiales (" + orgName + ")";
    var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);

    if (data.action === "create_folder") {
      var folderName = data.folderName || "Nueva Carpeta";
      var created = getOrCreateFolder(rootFolder, folderName);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Carpeta '" + folderName + "' creada en Google Drive", folderUrl: created.getUrl(), folderId: created.getId() })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "test") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Conexión exitosa con Google Drive. Carpeta: " + rootFolderName, folderUrl: rootFolder.getUrl() })).setMimeType(ContentService.MimeType.JSON);
    }

    var targetFolder = getOrCreateFolder(rootFolder, data.directory || "Reuniones Generales");
    var doc = DocumentApp.create((data.title || "Acta de Reunión") + " - " + (data.date || new Date().toISOString().split('T')[0]));
    var body = doc.getBody();
    body.setMarginTop(54).setMarginBottom(54).setMarginLeft(54).setMarginRight(54);
    body.appendParagraph(orgName.toUpperCase()).setHeading(DocumentApp.ParagraphHeading.HEADING3).setForegroundColor("#4f46e5");
    body.appendParagraph(data.title || "Acta de Reunión Oficial").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("📅 Fecha: " + (data.date || "N/A") + " | 📁 Carpeta: " + (data.directory || "General"));
    body.appendHorizontalRule();
    if (data.objectives) { body.appendParagraph("\\n1. OBJETIVOS").setHeading(DocumentApp.ParagraphHeading.HEADING2); body.appendParagraph(data.objectives); }
    body.appendParagraph("\\n2. DESARROLLO Y ACUERDOS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(data.pointsTreated || "Sin notas.");
    doc.saveAndClose();
    var file = DriveApp.getFileById(doc.getId());
    targetFolder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Acta guardada en Google Drive", fileUrl: doc.getUrl(), folderUrl: targetFolder.getUrl() })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}`;

