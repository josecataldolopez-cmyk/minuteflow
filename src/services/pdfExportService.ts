import { MeetingMinute, Organization } from '../types';
import { generateMinuteHTML } from './googleDriveOAuthService';

/**
 * Genera el documento institucional oficial del acta y abre el diálogo nativo
 * de impresión/PDF mediante un iframe oculto (sin bloqueo de pop-ups).
 */
export function exportMinuteToPdf(minute: MeetingMinute, organization?: Organization): boolean {
  try {
    const html = generateMinuteHTML(minute, organization);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      return false;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    // Esperar un ciclo breve para asegurar renderizado de estilos antes de imprimir
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);

    return true;
  } catch {
    return false;
  }
}
