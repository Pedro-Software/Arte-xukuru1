import { createClient } from '@supabase/supabase-js';
import { publicSupabaseConfig } from './supabasePublicConfig.js';

const env = import.meta.env || {};
const envUrl = env.VITE_SUPABASE_URL?.trim();
const envKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
// Use a mesma origem para o par URL/chave; um override incompleto não mistura projetos.
const hasEnvironmentConfig = Boolean(envUrl && envKey && !envUrl.includes('SEU_PROJETO') && !envKey.includes('SUBSTITUA'));
const { url, key } = hasEnvironmentConfig ? { url: envUrl, key: envKey } : publicSupabaseConfig;

export const supabaseConfig = {
  configured: Boolean(url && key && !url.includes('SEU_PROJETO') && !key.includes('SUBSTITUA')),
  url,
  key
};

export const supabase = supabaseConfig.configured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Conexão Supabase não configurada. Confira assets/js/lib/supabasePublicConfig.js ou as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
  return supabase;
}
