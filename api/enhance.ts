import { GoogleGenAI } from '@google/genai';

const MAX_INPUT_CHARS = 20000;

// Rate-limit básico en memoria (mejor esfuerzo: cada instancia serverless es efímera).
// Para producción real, usar un store compartido (Upstash/Redis) o Vercel Rate Limits.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function isAllowedOrigin(req: any): boolean {
  const allowed = process.env.ALLOWED_ORIGIN?.trim().replace(/\/+$/, '');
  if (!allowed) return true; // si no se configura, no se restringe por origen
  const origin = req.headers?.origin || req.headers?.referer || '';
  try {
    return new URL(origin).origin === allowed;
  } catch {
    return false;
  }
}

/**
 * Serverless Function para procesar actas y transcripciones con Google Gemini AI.
 * Protege la API Key en el servidor para que nunca se exponga en el navegador.
 */
export default async function handler(req: any, res: any) {
  // Permitir solo peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Origen no permitido' });
  }

  const ip =
    (req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Reintenta en un minuto.' });
  }

  // La key de IA solo debe vivir en el servidor. No se acepta la variante VITE_
  // (esas se inlinean en el bundle del cliente y quedarían expuestas).
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY no configurada en las variables de entorno del servidor' });
  }

  const { rawContent, contextTitle } = req.body || {};
  if (!rawContent || typeof rawContent !== 'string') {
    return res.status(400).json({ error: 'El contenido rawContent es requerido' });
  }
  if (rawContent.length > MAX_INPUT_CHARS) {
    return res.status(413).json({ error: `El contenido excede el máximo de ${MAX_INPUT_CHARS} caracteres` });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Eres un secretario ejecutivo corporativo experto en redacción de actas de directorio y reuniones de alta dirección.
Analiza las siguientes notas o transcripción de reunión y genera una minuta formal y estructurada.

Contexto / Título preliminar: ${contextTitle || 'Reunión Ejecutiva'}
Notas/Transcripción de la reunión:
"""
${rawContent.slice(0, 10000)}
"""

Responde estrictamente en formato JSON válido (sin bloques markdown fuera del JSON):
{
  "title": "Título formal y conciso de la reunión",
  "objectives": "Objetivo principal o propósito de la sesión en 1-2 oraciones formales",
  "pointsTreated": "Puntos tratados y acuerdos adoptados organizados con viñetas claras (• Puntos con viñetas)",
  "actionItems": [
    {
      "text": "Descripción clara del compromiso o tarea",
      "dueDate": "YYYY-MM-DD",
      "priority": "High"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    // Limpieza de bloques de código markdown ```json ... ```
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.status(200).json({
        title: parsed.title,
        objectives: parsed.objectives,
        pointsTreated: parsed.pointsTreated,
        actionItems: parsed.actionItems || []
      });
    }

    return res.status(500).json({ error: 'No se pudo extraer una estructura JSON válida de la respuesta del modelo' });
  } catch (error: any) {
    console.error('Error en Serverless Gemini Handler:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar la minuta con IA' });
  }
}
