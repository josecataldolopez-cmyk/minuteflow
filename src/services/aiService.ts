import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client with safe fallback
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface AIAnalysisResult {
  title?: string;
  objectives?: string;
  pointsTreated?: string;
  actionItems?: Array<{
    text: string;
    dueDate?: string;
    priority: 'Low' | 'Medium' | 'High';
  }>;
}

/**
 * Enhances rough notes, audio transcripts or minute points using Gemini AI.
 * Intenta primero mediante la Serverless Function segura (/api/enhance) para no exponer API keys;
 * si no está disponible, utiliza el SDK directo en cliente o el motor heurístico estructurado.
 */
export async function analyzeAndEnhanceMinute(
  rawContent: string,
  contextTitle?: string
): Promise<AIAnalysisResult> {
  const cleanInput = rawContent?.trim();
  if (!cleanInput) {
    return simulateAIEnhancement('', contextTitle);
  }

  // 1. Intentar primero a través del Gateway Serverless seguro en el backend
  try {
    const serverRes = await fetch('/api/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ rawContent: cleanInput, contextTitle })
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data && (data.title || data.objectives || data.pointsTreated)) {
        return {
          title: data.title,
          objectives: data.objectives,
          pointsTreated: data.pointsTreated,
          actionItems: data.actionItems || []
        };
      }
    }
  } catch {
    // Si la función serverless no está disponible (ej. entorno de desarrollo estático local), continuar
  }

  // 2. Intentar con cliente directo si se configuró VITE_GEMINI_API_KEY
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
Eres un secretario ejecutivo corporativo experto en redacción de actas de directorio y reuniones de alta dirección.
Analiza las siguientes notas o transcripción de reunión y genera una minuta formal y estructurada.

Contexto / Título preliminar: ${contextTitle || 'Reunión Ejecutiva'}
Notas/Transcripción de la reunión:
"""
${cleanInput.slice(0, 8000)}
"""

Responde estrictamente en formato JSON válido con la siguiente estructura (sin bloques markdown adicionales fuera del json):
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
      // Limpieza de bloques markdown ```json ... ```
      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title,
          objectives: parsed.objectives,
          pointsTreated: parsed.pointsTreated,
          actionItems: parsed.actionItems || []
        };
      }
    } catch (error) {
      console.warn('Error en llamada directa a Gemini AI, usando motor estructurado:', error);
    }
  }

  // 3. Fallback estructurado y seguro
  return simulateAIEnhancement(cleanInput, contextTitle);
}

/**
 * Fallback intelligent heuristic parser when offline or without API key.
 */
function simulateAIEnhancement(rawContent: string, contextTitle?: string): AIAnalysisResult {
  const lines = rawContent.split('\n').map((l) => l.trim()).filter(Boolean);
  
  const extractedPoints: string[] = [];
  const actionItems: Array<{ text: string; dueDate?: string; priority: 'Low' | 'Medium' | 'High' }> = [];

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const defaultDueDate = nextWeek.toISOString().split('T')[0];

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (
      lower.includes('compromiso') ||
      lower.includes('tarea') ||
      lower.includes('responsable') ||
      lower.includes('acordaron que') ||
      lower.includes('entregar') ||
      lower.includes('revisar') ||
      lower.includes('enviar')
    ) {
      actionItems.push({
        text: line.replace(/^[•\-\*]\s*/, '').replace(/^(tarea|compromiso):\s*/i, ''),
        dueDate: defaultDueDate,
        priority: lower.includes('urgente') || lower.includes('inmediato') ? 'High' : 'Medium'
      });
    } else {
      extractedPoints.push(line.startsWith('•') ? line : `• ${line}`);
    }
  });

  return {
    title: contextTitle || (lines[0] ? lines[0].replace(/^[#•\-\*]\s*/, '').slice(0, 60) : 'Sesión Extraordinaria de Directorio'),
    objectives: 'Consolidar y aprobar los acuerdos estratégicos, prioridades operativas y compromisos de seguimiento derivados de la reunión.',
    pointsTreated: extractedPoints.length > 0 
      ? extractedPoints.join('\n') 
      : '• Revisión de avances en los objetivos estratégicos y operacionales del trimestre.\n• Evaluación de propuestas y asignación de recursos prioritarios.\n• Aprobación de medidas de seguimiento y gobernanza interna.',
    actionItems: actionItems.length > 0 ? actionItems : [
      {
        text: 'Distribuir el acta oficial y recopilar firmas de los asistentes convocados',
        dueDate: defaultDueDate,
        priority: 'High'
      }
    ]
  };
}
