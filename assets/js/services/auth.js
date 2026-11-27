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
  if (!error) return;
  const code = String(error.code || '');
  const message = String(error.message || '');
  if (code === 'email_address_not_authorized' || /email.*not authorized/i.test(message)) {
    throw new Error('O serviço de e-mail do Supabase não permite enviar para este endereço. O responsável pelo projeto precisa configurar um provedor SMTP em Authentication. Isso não significa que sua conta não existe.');
  }
  if (['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code) || error.status === 429) {
    throw new Error('O Supabase atingiu o limite de solicitações ou envios de e-mail. Aguarde antes de tentar novamente. Consulte Authentication > Logs para identificar o limite.');
  }
  if (/smtp|sending.*email|send.*email/i.test(message) || error.status >= 500) {
    throw new Error('O Supabase não conseguiu enviar o e-mail. O responsável pelo projeto deve conferir o provedor SMTP e o erro em Authentication > Logs.');
  }
  if (/fetch|network/i.test(message)) {
    throw new Error('Não foi possível conectar ao Supabase. Confira sua conexão e tente novamente.');
  }
  const reference = /^[a-z0-9_]+$/i.test(code) ? code : (error.status || 'sem código');
  throw new Error('Não foi possível solicitar a recuperação de senha. Código: '+reference+'. Confira o registro em Authentication > Logs.');
}
