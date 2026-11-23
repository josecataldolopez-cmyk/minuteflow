import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let clientInstance: SupabaseClient | null = null;

/**
 * Indica si Supabase está configurado con las variables de entorno requeridas.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-supabase-url') &&
    !SUPABASE_ANON_KEY.includes('your-supabase-anon-key')
  );
}

/**
 * Obtiene o inicializa la instancia única del cliente de Supabase.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (err) {
      console.warn('PactaCloud: Error inicializando cliente de Supabase:', err);
      clientInstance = null;
    }
  }

  return clientInstance;
}

/**
 * Prueba la conectividad con la base de datos de Supabase.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tus variables de entorno.'
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'No se pudo instanciar el cliente de Supabase.'
    };
  }

  const startTime = Date.now();
  try {
    const { error } = await supabase.from('organizations').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // Si la tabla no existe aún, pero la conexión autentica
      if (error.code === '42P01') {
        return {
          success: true,
          message: `Conexión con Supabase verificada (${latencyMs}ms). Falta ejecutar el script schema.sql para crear las tablas.`,
          latencyMs
        };
      }
      return {
        success: false,
        message: `Error al consultar Supabase (${error.code}): ${error.message}`
      };
    }

    return {
      success: true,
      message: `Conexión con Supabase PostgreSQL activa y verificada (${latencyMs}ms).`,
      latencyMs
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Error desconocido de red';
    return {
      success: false,
      message: `Fallo de conexión con Supabase: ${errMsg}`
    };
  }
}
