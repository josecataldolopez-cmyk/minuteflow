import { getSupabase, isSupabaseConfigured } from './supabaseClient';

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
 * Toda llamada a IA pasa por la Serverless Function segura (/api/enhance), que
 * resguarda la API key en el servidor. Si no está disponible, se usa el motor
 * heurístico estructurado como fallback offline.
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }
    }

    const serverRes = await fetch('/api/enhance', {
      method: 'POST',
      headers,
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

  // 2. Fallback estructurado y seguro (sin API key ni backend disponible)
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
