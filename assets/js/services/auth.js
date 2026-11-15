import { requireSupabase } from '../lib/supabaseClient.js';

export async function signIn(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Não foi possível entrar. Confira e-mail e senha ou tente novamente.');
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    await client.auth.signOut();
    throw new Error('Sessão inválida. Entre novamente.');
  }
  const { data: operator, error: roleError } = await client.from('admin_users')
    .select('user_id, role, is_active').eq('user_id', userData.user.id).maybeSingle();
  if (roleError || !operator?.is_active || !['admin', 'editor'].includes(operator.role)) {
    await client.auth.signOut();
    throw new Error('Acesso não autorizado. Peça ao administrador para liberar sua conta.');
  }
  return { user: userData.user, role: operator.role, session: data.session };
}

export async function getOperator() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const result = await client.from('admin_users').select('user_id, role, is_active').eq('user_id', data.user.id).maybeSingle();
  if (result.error || !result.data?.is_active || !['admin', 'editor'].includes(result.data.role)) return { unauthorized: true, user: data.user };
  return { user: data.user, role: result.data.role };
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw new Error('Não foi possível encerrar a sessão.');
}

export async function requestPasswordReset(email, redirectTo) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error('Não foi possível enviar o link. Confira o e-mail e as URLs permitidas no Supabase.');
}
