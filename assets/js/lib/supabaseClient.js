import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

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
  if (!supabase) throw new Error('Conexão Supabase não configurada. Preencha URL e publishable key em .env.local e reinicie o Vite.');
  return supabase;
}
