import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const { TEST_SUPABASE_URL:url, TEST_SUPABASE_PUBLISHABLE_KEY:key } = process.env;
if (!url || !key) {
  console.error('Defina TEST_SUPABASE_URL e TEST_SUPABASE_PUBLISHABLE_KEY. Nenhuma credencial de admin/service_role é aceita.');
  process.exit(2);
}
const client = () => createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const assert = (condition,message) => { if(!condition) throw new Error(message); console.log('✓ '+message); };

async function signedIn(email,password,label) {
  if(!email||!password) throw new Error('Configure e-mail e senha de teste para '+label+' no ambiente.');
  const c=client(),auth=await c.auth.signInWithPassword({email,password});
  if(auth.error)throw new Error('Falha no login de teste ('+label+').');
  return c;
}
async function main() {
  const visitor=client();
  const visible=await visitor.from('public_products').select('id');
  assert(!visible.error,'visitante consulta a view pública');
  const draftColumns=await visitor.from('page_sections').select('draft_content').limit(1);
  assert(Boolean(draftColumns.error),'visitante não pode ler colunas draft do CMS');
  const visitorWrite=await visitor.from('products').insert({title:'teste',slug:'rls-test',category_slug:'ceramica',price:1,stock:1});
  assert(Boolean(visitorWrite.error),'visitante não pode gravar produtos');

  const ordinary=await signedIn(process.env.TEST_USER_EMAIL,process.env.TEST_USER_PASSWORD,'usuário sem papel');
  const ordinaryProducts=await ordinary.from('products').select('status');
  assert(!ordinaryProducts.error && !(ordinaryProducts.data||[]).some(p=>p.status!=='published'),'usuário comum só consulta produtos publicados');
  const ordinaryDraft=await ordinary.from('page_sections').select('draft_content').limit(1);
  assert(Boolean(ordinaryDraft.error),'usuário comum não pode selecionar conteúdo draft diretamente');
  const ordinarySettings=await ordinary.from('site_settings').select('draft_value').limit(1);
  assert(Boolean(ordinarySettings.error),'usuário comum não pode selecionar configurações draft diretamente');
  const ordinaryOperatorView=await ordinary.from('operator_page_sections').select('draft_content').limit(1);
  assert(!ordinaryOperatorView.error && !(ordinaryOperatorView.data||[]).length,'view administrativa não retorna rascunhos a usuário comum');
  const ordinarySettingsView=await ordinary.from('operator_site_settings').select('draft_value').limit(1);
  assert(!ordinarySettingsView.error && !(ordinarySettingsView.data||[]).length,'view administrativa não retorna configurações draft a usuário comum');
  const roleWrite=await ordinary.from('admin_users').update({role:'admin'}).eq('user_id',(await ordinary.auth.getUser()).data.user.id);
  assert(Boolean(roleWrite.error),'usuário comum não pode alterar papel');

  const editor=await signedIn(process.env.TEST_EDITOR_EMAIL,process.env.TEST_EDITOR_PASSWORD,'editor');
  const editorDrafts=await editor.from('products').select('id,status').in('status',['draft','pending_review']).limit(1);
  assert(!editorDrafts.error,'editor consegue ler rascunhos autorizados');
  const editorSections=await editor.from('operator_page_sections').select('id,draft_content').limit(1);
  assert(!editorSections.error && (editorSections.data||[]).length>0,'editor autorizado consegue ler rascunhos CMS pela view privada');
  const editorSettings=await editor.from('operator_site_settings').select('key,draft_value').limit(1);
  assert(!editorSettings.error && (editorSettings.data||[]).length>0,'editor autorizado consegue ler configurações draft pela view privada');
  if(!editorDrafts.data?.length) throw new Error('O seed de rascunhos é necessário para testar a proibição de publicação.');
  const promotion=await editor.from('products').update({status:'published'}).eq('id',editorDrafts.data[0].id);
  assert(Boolean(promotion.error),'editor não pode publicar via REST');
  const probePath='rls-probe-'+randomUUID()+'.webp';
  const editorPublicUpload=await editor.storage.from('xukuru-public').upload(probePath,new Blob(['x'],{type:'image/webp'}),{contentType:'image/webp'});
  const admin=await signedIn(process.env.TEST_ADMIN_EMAIL,process.env.TEST_ADMIN_PASSWORD,'admin');
  if(!editorPublicUpload.error){const cleanup=await admin.storage.from('xukuru-public').remove([probePath]);assert(!cleanup.error,'limpeza do arquivo de teste criado após falha de policy');}
  const uploadDenied=Boolean(editorPublicUpload.error)&&(/permission|policy|row-level|42501|403/i.test(editorPublicUpload.error.message||'')||String(editorPublicUpload.error.statusCode||'')==='403');
  assert(uploadDenied,'editor não pode fazer upload direto no bucket público');
  const audit=await admin.from('audit_logs').select('id').limit(1);
  assert(!audit.error,'admin consulta auditoria');
  const adminRoleWrite=await admin.from('admin_users').update({role:'editor'}).eq('user_id',(await admin.auth.getUser()).data.user.id);
  assert(Boolean(adminRoleWrite.error),'nem admin de frontend altera papéis pela API');
  console.log('RLS smoke test concluído. Sem alteração de registro cultural nem credenciais privilegiadas.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
