import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Devuelve las credenciales configuradas para Supabase.
 * En el servidor prioriza SUPABASE_SERVICE_ROLE_KEY si existe; caso contrario usa
 * NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

/**
 * Crea una instancia de Supabase para usar en Route Handlers (servidor).
 * Se instancia bajo demanda para no fallar durante `next build` sin .env.local.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
