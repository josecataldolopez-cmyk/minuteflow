import { GoogleGenAI } from '@google/genai';

/**
 * Serverless Function para procesar actas y transcripciones con Google Gemini AI.
 * Protege la API Key en el servidor para que nunca se exponga en el navegador.
 */
export default async function handler(req: any, res: any) {
  // Permitir solo peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY no configurada en las variables de entorno del servidor' });
  }

  const { rawContent, contextTitle } = req.body || {};
  if (!rawContent || typeof rawContent !== 'string') {
    return res.status(400).json({ error: 'El contenido rawContent es requerido' });
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
