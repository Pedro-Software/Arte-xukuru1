import { supabase, supabaseConfig, requireSupabase } from '../lib/supabaseClient.js';
import { signIn, getOperator, signOut, requestPasswordReset } from '../services/auth.js';
import { isApprovedMediaUrl } from '../services/cms.js';
import { SAFE_LAYOUTS, SAFE_FONTS, slugify, validateProduct, validateImage, validateTheme } from '../services/validation.js';

const root = document.getElementById('admin-root');
const state = { operator:null, module:'dashboard', products:[], categories:[], productThumbs:{}, productPage:0, pages:[], sections:[], settings:[], pageSlug:'home', sectionId:null, sectionDirty:false, productDirty:false, productPreviewUrl:'', theme:{}, themeSettings:null };
const labels = {dashboard:'Visão geral',products:'Produtos',categories:'Categorias',content:'Editor de páginas',appearance:'Aparência',media:'Biblioteca de mídia',settings:'Configurações',history:'Histórico'};
const $ = (s, scope=document) => scope.querySelector(s);
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currency = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const admin = () => state.operator && state.operator.role === 'admin';
const toast = msg => { const el=$('#admin-toast'); if(!el)return; el.textContent=msg; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),3600); };
const errorText = err => { const m=String(err && err.message || ''); if(/42501|permission|policy|unauthorized/i.test(m))return 'Ação não autorizada para este perfil.'; if(/relation .* does not exist|schema cache/i.test(m))return 'Banco ainda não preparado. Execute a migração e o seed.'; if(/bucket/i.test(m))return 'Bucket ainda não criado. Execute a migração.'; return m || 'Não foi possível concluir. Tente novamente.'; };
const titleCase = v => ({draft:'Rascunho',pending_review:'Em revisão',published:'Publicado',archived:'Arquivado',pending:'Pendente',approved:'Aprovado',rejected:'Rejeitado',create:'Criação',update:'Edição',publish:'Publicação',archive:'Arquivamento'}[v] || v);
const rows = async (table, columns='*') => { const r=await requireSupabase().from(table).select(columns); if(r.error)throw r.error; return r.data||[]; };

function renderLogin(message='', reset=false) {
 root.innerHTML=`<main class="admin-login-wrap">
  <section class="login-visual" aria-label="Arte Xukuru do Ororubá">
   <div class="login-visual-image" role="img" aria-label="Composição de artesanato diante de uma paisagem ao entardecer"></div>
   <div class="login-visual-shape login-visual-shape-one" aria-hidden="true"></div>
   <div class="login-visual-shape login-visual-shape-two" aria-hidden="true"></div>
   <a class="login-brand login-brand-visual" href="./" aria-label="Arte Xukuru do Ororubá, voltar ao site">
    <span class="login-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="1.4"/><path d="M9 30c5.4-7.8 10.2-7.8 15 0s9.6 7.8 15 0M10 35h28M14 18l4-4 4 4M26 15l3-3 3 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg></span>
    <span class="login-brand-name">Arte Xukuru<small>do Ororubá</small></span>
   </a>
   <div class="login-visual-copy">
    <span class="login-eyebrow"><span aria-hidden="true"></span> PAINEL DE GESTÃO</span>
    <h2>Cuidar da vitrine<br>é cuidar do que ela conta.</h2>
    <p>Um espaço para organizar o catálogo, as imagens e os conteúdos da Arte Xukuru.</p>
   </div>
   <div class="login-visual-footer">
    <div class="login-glass-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" stroke="currentColor" stroke-width="1.5"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg></div>
    <span><strong>Um espaço de cuidado</strong><small>Catálogo · Conteúdo · Imagens</small></span>
    <span class="login-glass-arrow" aria-hidden="true">↗</span>
   </div>
  </section>
  <section class="login-panel" aria-labelledby="login-heading">
   <div class="login-card">
    <a class="login-brand login-brand-mobile" href="./" aria-label="Arte Xukuru do Ororubá, voltar ao site">
     <span class="login-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="1.4"/><path d="M9 30c5.4-7.8 10.2-7.8 15 0s9.6 7.8 15 0M10 35h28M14 18l4-4 4 4M26 15l3-3 3 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg></span>
     <span class="login-brand-name">Arte Xukuru<small>do Ororubá</small></span>
    </a>
    <div class="login-heading">
     <span class="login-kicker">${reset?'RECUPERAÇÃO SEGURA':'ACESSO ADMINISTRATIVO'}</span>
     <h1 id="login-heading">${reset?'Definir nova senha':'Boas-vindas'}</h1>
     <p>${reset?'Escolha uma nova senha para sua conta de operador.':'Entre com sua conta autorizada para continuar.'}</p>
    </div>
    ${!supabaseConfig.configured?'<div class="notice">Confira a URL e a chave pública em assets/js/lib/supabasePublicConfig.js ou nas variáveis do projeto.</div>':''}
    ${message?'<div class="form-error" role="alert">'+esc(message)+'</div>':''}
    <form id="login-form" class="admin-form login-form">
     ${reset?'<label for="login-password">Nova senha<input id="login-password" name="password" type="password" minlength="8" autocomplete="new-password" required></label><button class="btn btn-primary login-submit" type="submit">Salvar senha <span aria-hidden="true">→</span></button>':'<label for="login-email">E-mail<input id="login-email" name="email" type="email" autocomplete="username" placeholder="voce@exemplo.com" required></label><label for="login-password">Senha<input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required></label><button class="btn btn-primary login-submit" type="submit">Entrar no painel <span aria-hidden="true">→</span></button><button class="text-button login-reset" type="button" data-action="reset">Esqueci minha senha</button>'}
    </form>
    <div class="login-security"><span class="login-security-icon" aria-hidden="true">●</span><p>Acesso restrito a operadores autorizados.<br><strong>Não há cadastro público.</strong></p></div>
    <footer class="login-card-footer">ARTE XUKURU DO ORORUBÁ <span>·</span> GESTÃO RESPONSÁVEL</footer>
   </div>
  </section>
 </main>`;
}
function shell() {
 const nav=[['dashboard','◫'],['products','▦'],['categories','◇'],['content','▤'],['appearance','◐'],['media','▧'],['settings','⚙']];
 if(admin())nav.push(['history','◷']);
 root.innerHTML='<div class="admin-shell"><aside id="admin-sidebar" class="admin-sidebar"><div class="admin-brand">Arte Xukuru<small>Gestão de conteúdo</small></div><nav class="admin-nav" aria-label="Menu administrativo">'+nav.map(x=>'<button type="button" data-action="module" data-value="'+x[0]+'" class="'+(state.module===x[0]?'active':'')+'">'+x[1]+' &nbsp; '+labels[x[0]]+'</button>').join('')+'</nav><div class="admin-side-bottom"><a href="./" target="_blank" rel="noopener">↗ Abrir site público</a><p>'+esc(state.operator.user.email||'')+'</p><button class="btn btn-quiet" data-action="logout">Sair</button></div></aside><main class="admin-main"><header class="admin-topbar"><div class="button-row"><button class="btn btn-quiet mobile-nav-toggle" data-action="toggle-nav" aria-label="Abrir menu">☰</button><h1>'+labels[state.module]+'</h1></div><div class="operator-chip"><span>'+(admin()?'Administrador':'Editor')+' · '+esc(state.operator.user.email||'')+'</span><button class="btn btn-quiet" data-action="logout">Sair</button></div></header><section id="admin-content" class="admin-content"><div class="admin-loading"><span class="spinner"></span><p>Carregando…</p></div></section></main></div>';
 loadModule().catch(showError);
}
function showError(err) {
 const host=$('#admin-content'); if(!host)return;
 host.innerHTML='<div class="empty-state"><h2>Não foi possível carregar</h2><p>'+esc(errorText(err))+'</p><button class="btn btn-primary" data-action="retry">Tentar novamente</button></div>';
}
const heading = (name, help, action='') => '<div class="page-heading"><div><h2>'+esc(name)+'</h2><p>'+esc(help)+'</p></div><div class="button-row">'+action+'</div></div>';
const stat = (name,value) => '<article class="stat-card"><strong>'+esc(value)+'</strong><span>'+esc(name)+'</span></article>';
async function loadModule() {
 if(state.module==='dashboard')return dashboard();
 if(state.module==='products')return products();
 if(state.module==='categories')return categories();
 if(state.module==='content')return content();
 if(state.module==='appearance')return appearance();
 if(state.module==='media')return media();
 if(state.module==='settings')return settings();
 if(state.module==='history')return historyPage();
}
async function dashboard() {
 const [ps,cs,ss]=await Promise.all([rows('products','id,status,stock,cultural_approval_status,title'),rows('categories','id,is_active'),rows('operator_page_sections','id,draft_content,published_content')]);
 let logs=[]; if(admin()){const r=await requireSupabase().from('audit_logs').select('action,entity_type,summary,created_at').order('created_at',{ascending:false}).limit(8);if(!r.error)logs=r.data||[];}
 const changed=ss.filter(x=>JSON.stringify(x.draft_content)!==JSON.stringify(x.published_content)).length;
 $('#admin-content').innerHTML=heading('Visão geral','Estado do catálogo e do conteúdo. Nenhuma venda ou receita é calculada.')+
 '<div class="stats-grid">'+stat('Produtos',ps.length)+stat('Publicados',ps.filter(x=>x.status==='published').length)+stat('Em rascunho',ps.filter(x=>x.status==='draft').length)+stat('Validação cultural pendente',ps.filter(x=>x.cultural_approval_status==='pending').length)+stat('Estoque baixo (até 5)',ps.filter(x=>x.stock<=5&&x.status!=='archived').length)+stat('Categorias ativas',cs.filter(x=>x.is_active).length)+stat('Seções com alterações',changed)+'</div><section class="panel"><h3>Ações rápidas</h3><div class="quick-actions"><button class="btn btn-primary" data-action="new-product">＋ Novo produto</button><button class="btn btn-quiet" data-action="home-editor">Editar página inicial</button><a class="btn btn-quiet" href="./" target="_blank" rel="noopener">Ver site</a></div></section>'+
 '<section class="panel"><h3>Alterações recentes</h3>'+(logs.length?'<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Ação</th><th>Tipo</th><th>Resumo</th></tr></thead><tbody>'+logs.map(x=>'<tr><td>'+esc(new Date(x.created_at).toLocaleString('pt-BR'))+'</td><td>'+esc(titleCase(x.action))+'</td><td>'+esc(x.entity_type)+'</td><td>'+esc(x.summary)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty-state">Ainda não há alterações.</div>')+'</section>';
}
async function products() {
 [state.products,state.categories]=await Promise.all([rows('products'),rows('categories')]);
 const images=await rows('product_images','id,product_id,storage_bucket,storage_path,alt_text,is_cover,sort_order');
 state.productThumbs={};
 await Promise.all(images.map(async im=>{let url='';if(im.storage_bucket==='xukuru-public')url=requireSupabase().storage.from(im.storage_bucket).getPublicUrl(im.storage_path).data.publicUrl;else{const signed=await requireSupabase().storage.from(im.storage_bucket).createSignedUrl(im.storage_path,900);url=signed.data?.signedUrl||'';}const prev=state.productThumbs[im.product_id];if(url&&(!prev||im.is_cover))state.productThumbs[im.product_id]={url,alt:im.alt_text||''};}));
 $('#admin-content').innerHTML=heading('Produtos','Dados e rascunhos do catálogo. Preços são referências.','<button class="btn btn-primary" data-action="new-product">＋ Novo produto</button>')+
 '<div class="toolbar"><input id="product-search" type="search" placeholder="Buscar por nome, categoria ou produtor"><select id="product-status"><option value="">Todos os status</option>'+['draft','pending_review','published','archived'].map(x=>'<option value="'+x+'">'+titleCase(x)+'</option>').join('')+'</select><select id="product-sort"><option value="updated">Mais recentes</option><option value="title">Nome</option><option value="price">Preço</option><option value="stock">Estoque</option></select><span class="status-pill status-pending">Valide autorização, imagem e preço antes da publicação.</span></div><div id="product-table"></div><div id="product-pagination" class="button-row"></div><div id="product-form-host"></div>';
 $('#product-search').oninput=()=>{state.productPage=0;drawProductTable();};$('#product-status').onchange=()=>{state.productPage=0;drawProductTable();};$('#product-sort').onchange=()=>{state.productPage=0;drawProductTable();};drawProductTable();
}
function installLocalPhotoImport() {
 const actions=$('#admin-content .page-heading .button-row');
 if(!actions||$('#local-photo-folder'))return;
 actions.insertAdjacentHTML('afterbegin','<button class="btn btn-secondary" data-action="import-local-photos">Selecionar fotos em lote</button>');
 $('#admin-content').insertAdjacentHTML('afterbegin','<input id="local-photo-folder" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>');
 $('#local-photo-folder').addEventListener('change',async e=>{const files=Array.from(e.target.files||[]);try{await importLocalProductPhotos(files);}catch(err){toast(errorText(err));}finally{e.target.value='';}});
}
function drawProductTable() {
 installLocalPhotoImport();
 const q=($('#product-search')?.value||'').toLowerCase(),f=$('#product-status')?.value||'';
 const ps=state.products.filter(p=>(!f||p.status===f)&&(!q||[p.title,p.slug,p.category_slug,p.artisan].some(v=>String(v||'').toLowerCase().includes(q))));
 const sort=$('#product-sort')?.value||'updated';ps.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='price'?Number(a.price)-Number(b.price):sort==='stock'?Number(a.stock)-Number(b.stock):new Date(b.updated_at||0)-new Date(a.updated_at||0));
 const pageSize=15,totalPages=Math.max(1,Math.ceil(ps.length/pageSize));state.productPage=Math.min(state.productPage,totalPages-1);const visible=ps.slice(state.productPage*pageSize,(state.productPage+1)*pageSize);
 $('#product-table').innerHTML=visible.length?'<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Imagem</th><th>Produto</th><th>Categoria</th><th>Preço ref.</th><th>Estoque</th><th>Destaque</th><th>Status</th><th>Autorização</th><th>Atualizado</th><th></th></tr></thead><tbody>'+visible.map(p=>{
  const image=state.productThumbs[p.id],category=state.categories.find(c=>c.slug===p.category_slug)?.name||p.category_slug;
  const thumb=image?'<img class="product-thumb" src="'+esc(image.url)+'" alt="'+esc(image.alt||p.title)+'">':'<span class="product-thumb-empty">Sem imagem</span>';
  const edit=admin()||['draft','pending_review'].includes(p.status)?'<button class="btn btn-quiet" data-action="edit-product" data-id="'+esc(p.id)+'">Editar</button>':'<span class="status-pill">Somente leitura</span>';
  const publish=admin()&&p.status==='published'?'<button class="btn btn-secondary" data-action="publish-product" data-id="'+esc(p.id)+'">Atualizar publicação</button>':(admin()&&p.status!=='archived'?'<button class="btn btn-secondary" data-action="publish-product" data-id="'+esc(p.id)+'">Publicar</button>':'');
  const unpublish=admin()&&p.status==='published'?'<button class="btn btn-quiet" data-action="unpublish-product" data-id="'+esc(p.id)+'">Despublicar</button>':'';
  const archive=admin()&&p.status!=='archived'?'<button class="btn btn-danger" data-action="archive-product" data-id="'+esc(p.id)+'">Arquivar</button>':'';
  return '<tr><td>'+thumb+'</td><td><strong>'+esc(p.title)+'</strong><br><small>'+esc(p.slug)+'</small></td><td>'+esc(category)+'</td><td>'+currency(p.price)+'</td><td>'+esc(p.stock)+'</td><td>'+(p.featured?'Sim':'—')+'</td><td><span class="status-pill status-'+esc(p.status)+'">'+titleCase(p.status)+'</span></td><td><span class="status-pill status-'+esc(p.cultural_approval_status)+'">'+titleCase(p.cultural_approval_status)+'</span></td><td>'+esc(p.updated_at?new Date(p.updated_at).toLocaleDateString('pt-BR'):'—')+'</td><td><div class="button-row">'+edit+publish+unpublish+archive+'</div></td></tr>';
 }).join('')+'</tbody></table></div>':'<div class="empty-state">Nenhum produto encontrado.</div>';
 $('#product-pagination').innerHTML=ps.length?'<small>Mostrando '+(state.productPage*pageSize+1)+'–'+Math.min((state.productPage+1)*pageSize,ps.length)+' de '+ps.length+'</small><button class="btn btn-quiet" data-action="product-page" data-value="-1" '+(state.productPage===0?'disabled':'')+'>Anterior</button><button class="btn btn-quiet" data-action="product-page" data-value="1" '+(state.productPage>=totalPages-1?'disabled':'')+'>Próxima</button>':'';
}
function input(name,label,value='',type='text',wide=false) {
 const cls=wide?'field full':'field',id='p-'+name;
 const control=type==='textarea'?'<textarea id="'+id+'" name="'+name+'" maxlength="5000">'+esc(value)+'</textarea>':'<input id="'+id+'" name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(type==='number'?'step="any"':'')+'>';
 return '<div class="'+cls+'"><label for="'+id+'">'+esc(label)+'</label>'+control+'</div>';
}
async function productForm(p=null) {
 if(state.productPreviewUrl){URL.revokeObjectURL(state.productPreviewUrl);state.productPreviewUrl='';}
 const fresh=!p, defaults={title:'',description:'',short_description:'',category_slug:(state.categories.find(c=>c.is_active)||{}).slug||'',price:'',stock:0,featured:false,artisan:'',village:'',materials:'',dimensions:'',weight:'',image_alt:'',sort_order:state.products.length,status:'draft',cultural_approval_status:'pending',cultural_approval_reference:'',cultural_approval_notes:''};
 p=Object.assign(defaults,p||{});
 const cats=state.categories.filter(c=>c.is_active);
 const approval=admin()?'<div class="field full"><label for="p-cultural_approval_status">Validação cultural</label><select id="p-cultural_approval_status" name="cultural_approval_status"><option value="pending" '+(p.cultural_approval_status==='pending'?'selected':'')+'>Pendente de validação</option><option value="approved" '+(p.cultural_approval_status==='approved'?'selected':'')+'>Aprovada após confirmação humana</option><option value="rejected" '+(p.cultural_approval_status==='rejected'?'selected':'')+'>Rejeitada / não autorizada</option></select></div>'+input('cultural_approval_reference','Referência interna da autorização',p.cultural_approval_reference,'text',true)+input('cultural_approval_notes','Observação interna',p.cultural_approval_notes,'textarea',true)+'<label class="checkbox-field field full"><input type="checkbox" name="approval_confirmation"> Confirmo que a autorização foi validada com representante legitimamente autorizado.</label>':'<div class="notice field full">Somente admin registra aprovação cultural e publica. Editor pode salvar rascunhos e solicitar revisão.</div>';
 $('#product-form-host').innerHTML='<section class="panel"><div class="page-heading"><div><h3>'+(fresh?'Novo produto':'Editar produto')+'</h3><p>Informações comerciais e culturais precisam ser confirmadas.</p></div><button class="btn btn-quiet" data-action="close-form">Fechar</button></div><form id="product-form"><div class="product-form-grid">'+input('title','Nome',p.title)+
 '<div class="field"><label for="p-category_slug">Categoria</label><select name="category_slug" id="p-category_slug" required>'+cats.map(c=>'<option value="'+esc(c.slug)+'" '+(p.category_slug===c.slug?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></div>'+
 input('price','Preço de referência (R$)',p.price,'number')+input('stock','Estoque informado',p.stock,'number')+input('artisan','Pessoa / coletivo produtor',p.artisan)+input('village','Local informado',p.village)+input('dimensions','Dimensões',p.dimensions)+input('weight','Peso',p.weight)+input('sort_order','Ordem',p.sort_order,'number')+input('image_alt','Texto alternativo da imagem',p.image_alt,'text',true)+input('materials','Materiais / composição',p.materials,'textarea',true)+input('short_description','Descrição curta',p.short_description,'textarea',true)+input('description','Descrição completa',p.description,'textarea',true)+
 '<label class="checkbox-field field"><input type="checkbox" name="featured" '+(p.featured?'checked':'')+'> Destaque</label><div class="field"><label for="p-status">Status</label><select name="status" id="p-status"><option value="draft" '+(p.status==='draft'?'selected':'')+'>Rascunho</option><option value="pending_review" '+(p.status==='pending_review'?'selected':'')+'>Solicitar revisão</option>'+(admin()&&p.status==='published'?'<option value="published" selected>Publicado (confirmar alterações)</option>':'')+'<option value="archived" '+(p.status==='archived'?'selected':'')+'>Arquivado</option></select></div>'+approval+
 '<div class="field full"><label for="product-photo">Adicionar imagem à galeria (JPEG, PNG, WebP; até 5 MB)</label><input type="file" id="product-photo" accept="image/jpeg,image/png,image/webp" '+(fresh?'disabled':'')+'><small>'+(fresh?'Salve antes de anexar.':'A foto nova permanece privada até revisão/publicação.')+'</small><div id="photo-preview"></div></div></div><div class="button-row" style="margin-top:16px"><button class="btn btn-primary">Salvar rascunho</button><button class="btn btn-quiet" type="button" data-action="request-review">Solicitar revisão</button></div></form><div id="product-live-preview" class="product-live-preview"></div>'+(fresh?'':'<div id="product-images" class="image-preview-grid"></div>')+'</section>';
 $('#product-form').onsubmit=e=>saveProduct(e,p.id);
 state.productDirty=false;$('#product-form').addEventListener('input',()=>{state.productDirty=true;drawProductPreview();});$('#product-form').addEventListener('change',()=>{state.productDirty=true;});
 if(!admin())$('#p-status option[value="archived"]')?.remove();
 $('#product-photo')?.addEventListener('change',e=>{const file=e.target.files[0],valid=validateImage(file);if(!valid.valid){toast(valid.error);e.target.value='';return;}if(state.productPreviewUrl)URL.revokeObjectURL(state.productPreviewUrl);state.productPreviewUrl=URL.createObjectURL(file);$('#photo-preview').textContent=file.name+' — '+Math.ceil(file.size/1024)+' KB';drawProductPreview();});
 drawProductPreview(p);
 if(!fresh)await productImages(p.id);
}
function drawProductPreview(original={}) {
 const form=$('#product-form'),host=$('#product-live-preview');if(!form||!host)return;
 const values=Object.fromEntries(new FormData(form).entries()),category=state.categories.find(c=>c.slug===values.category_slug)?.name||'Categoria';
 host.innerHTML='<h4>Prévia do cartão público · valores de referência</h4><article class="product-preview-card">'+(state.productPreviewUrl?'<img src="'+esc(state.productPreviewUrl)+'" alt="Prévia local da imagem" loading="lazy">':'<div class="media-slot">Imagem aprovada aparecerá aqui</div>')+'<div><small>'+esc(category)+'</small><h3>'+esc(values.title||'Nome do produto')+'</h3><p>'+esc(values.short_description||'Descrição curta ainda não informada.')+'</p><strong>'+currency(values.price||0)+'</strong> <small>referência</small><div><button class="btn btn-quiet" type="button" data-action="preview-product">Prévia de detalhes</button></div></div></article><small>A imagem escolhida nesta prévia permanece local e privada até envio e publicação.</small>';
}
function previewProductModal() {
 const form=$('#product-form');if(!form)return;const v=Object.fromEntries(new FormData(form).entries()),category=state.categories.find(c=>c.slug===v.category_slug)?.name||'Categoria';
 const dialog=document.createElement('dialog');dialog.className='admin-dialog';dialog.innerHTML='<div class="dialog-inner"><div class="page-heading"><div><small>'+esc(category)+' · valor de referência</small><h2>'+esc(v.title||'Nome do produto')+'</h2></div><button class="btn btn-quiet" data-action="close-product-preview">Fechar</button></div>'+(state.productPreviewUrl?'<img class="product-modal-preview-image" src="'+esc(state.productPreviewUrl)+'" alt="'+esc(v.image_alt||v.title||'Prévia local')+'">':'<div class="media-slot">Imagem aprovada aparecerá aqui</div>')+'<p>'+esc(v.description||v.short_description||'Descrição ainda não informada.')+'</p><dl><dt>Produtor</dt><dd>'+esc(v.artisan||'Não informado')+'</dd><dt>Local informado</dt><dd>'+esc(v.village||'Não informado')+'</dd><dt>Materiais</dt><dd>'+esc(v.materials||'Não informado')+'</dd><dt>Dimensões</dt><dd>'+esc(v.dimensions||'Não informadas')+'</dd><dt>Estoque informado</dt><dd>'+esc(v.stock||'0')+'</dd></dl><strong>'+currency(v.price||0)+' · referência</strong></div>';
 document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
async function saveProduct(event,id) {
 event.preventDefault();const form=event.currentTarget,fd=new FormData(form),v=Object.fromEntries(fd.entries());
 v.featured=fd.has('featured');v.price=Number(v.price);v.stock=Number(v.stock);v.sort_order=Number(v.sort_order||0);
 const check=validateProduct(v);if(!check.valid){toast(Object.values(check.errors)[0]);return;}
 const approve=admin()&&v.cultural_approval_status==='approved';
 if(approve&&(!fd.has('approval_confirmation')||!String(v.cultural_approval_reference||'').trim())){toast('Confirme a autorização e registre uma referência interna.');return;}
 const user=approve?await requireSupabase().auth.getUser():null;
 const data={title:String(v.title).trim(),slug:slugify(v.title),description:v.description||'',short_description:v.short_description||'',category_slug:v.category_slug,price:v.price,stock:v.stock,featured:v.featured,artisan:v.artisan||'',village:v.village||'',materials:v.materials||'',dimensions:v.dimensions||'',weight:v.weight||'',image_alt:v.image_alt||'',sort_order:v.sort_order,status:v.status==='published'&&admin()?'published':(v.status==='archived'?'archived':(v.status==='pending_review'?'pending_review':'draft')),cultural_approval_status:approve?'approved':(admin()?v.cultural_approval_status:'pending'),cultural_approval_reference:admin()?v.cultural_approval_reference||'':'',cultural_approval_notes:admin()?v.cultural_approval_notes||'':'',cultural_approved_by:approve?user.data.user.id:null,cultural_approved_at:approve?new Date().toISOString():null};
 const client=requireSupabase(),r=id?await client.from('products').update(data).eq('id',id).select().single():await client.from('products').insert(data).select().single();
 if(r.error){toast(errorText(r.error));return;}
 const file=$('#product-photo')?.files?.[0];let uploadFailure='';if(file){try{await uploadProductPhoto(r.data.id,file,data.image_alt||data.title);}catch(err){uploadFailure=errorText(err);}}
 state.productDirty=false;toast(uploadFailure?'Produto salvo, mas o upload falhou: '+uploadFailure:(data.status==='published'?'Dados publicados atualizados. A nova imagem enviada segue privada até atualização da publicação.':'Rascunho salvo. O site público não mudou.'));await products();await productForm(r.data);
}
async function uploadProductPhoto(id,file,alt) {
 const check=validateImage(file);if(!check.valid)throw new Error(check.error);
 const client=requireSupabase(),ext=file.type==='image/jpeg'?'jpg':file.type.split('/')[1],path=id+'/'+crypto.randomUUID()+'.'+ext;
 const up=await client.storage.from('xukuru-drafts').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;
 const row=await client.from('product_images').insert({product_id:id,storage_bucket:'xukuru-drafts',storage_path:path,alt_text:alt,is_cover:false,authorization_status:'pending'}).select().single();
 if(row.error){await client.storage.from('xukuru-drafts').remove([path]);throw row.error;}
 const media=await client.from('media_assets').insert({storage_bucket:'xukuru-drafts',storage_path:path,mime_type:file.type,size_bytes:file.size,alt_text:alt,authorization_status:'pending',created_by:state.operator.user.id});
 if(media.error){await client.from('product_images').delete().eq('id',row.data.id);await client.storage.from('xukuru-drafts').remove([path]);throw media.error;}
}
async function importLocalProductPhotos(files) {
 if(!files.length)return;
 const eligible=state.products.filter(p=>p.legacy_image_url&&['draft','pending_review'].includes(p.status));
 if(!eligible.length){toast('Não encontrei produtos em rascunho com fotos mapeadas. Confira se os produtos do seed foram carregados.');return;}
 const basename=value=>String(value||'').replace(/\\/g,'/').split('/').pop().toLocaleLowerCase();
 const byFilename=new Map(files.map(file=>[basename(file.name||file.webkitRelativePath),file]));
 const matched=eligible.map(product=>({product,file:byFilename.get(basename(product.legacy_image_url))})).filter(item=>item.file);
 if(!matched.length){toast('Recebi '+files.length+' arquivo(s), mas nenhum nome coincide com as fotos dos produtos. Abra imgs, selecione as imagens (Ctrl+A) e clique em Abrir.');return;}
 const client=requireSupabase(),existing=await rows('product_images','product_id,storage_bucket,storage_path,is_cover');
 const existingProductIds=new Set(existing.map(image=>image.product_id));
 const pending=matched.filter(item=>!existingProductIds.has(item.product.id));
 const skipped=matched.length-pending.length;
 if(!pending.length){toast('As fotos correspondentes já foram importadas.');return;}
 if(!confirm('Importar '+pending.length+' foto(s) correspondente(s) para os produtos em rascunho? Elas serão enviadas ao bucket privado e não ficarão visíveis no site até a aprovação e publicação.'))return;
 const results=[];
 for(const [index,item] of pending.entries()){
  const check=validateImage(item.file);
  if(!check.valid){results.push(item.file.name+': '+check.error);continue;}
  const ext=item.file.type==='image/jpeg'?'jpg':item.file.type.split('/')[1];
  const path=item.product.id+'/'+crypto.randomUUID()+'.'+ext;
  let uploaded=false,imageId=null;
  try{
   const up=await client.storage.from('xukuru-drafts').upload(path,item.file,{contentType:item.file.type,upsert:false});
   if(up.error)throw up.error;uploaded=true;
   const image=await client.from('product_images').insert({product_id:item.product.id,storage_bucket:'xukuru-drafts',storage_path:path,alt_text:item.product.image_alt||item.product.title,is_cover:!existing.some(row=>row.product_id===item.product.id&&row.is_cover),authorization_status:'pending'}).select('id').single();
   if(image.error)throw image.error;imageId=image.data.id;
   const media=await client.from('media_assets').insert({storage_bucket:'xukuru-drafts',storage_path:path,mime_type:item.file.type,size_bytes:item.file.size,alt_text:item.product.image_alt||item.product.title,authorization_status:'pending',created_by:state.operator.user.id});
   if(media.error)throw media.error;
   results.push(null);
  }catch(err){
   if(imageId)await client.from('product_images').delete().eq('id',imageId);
   if(uploaded)await client.storage.from('xukuru-drafts').remove([path]);
   results.push(item.file.name+': '+errorText(err));
  }
  toast('Importando fotos '+(index+1)+'/'+pending.length+'…');
 }
 const failed=results.filter(Boolean),succeeded=results.length-failed.length;
 await products();
 toast('Importação concluída: '+succeeded+' foto(s) enviada(s) ao privado'+(skipped?', '+skipped+' já existente(s)':'')+(failed.length?', '+failed.length+' falha(s): '+failed[0]:'')+'.');
 if(failed.length)console.warn('Falhas ao importar fotos locais:',failed);
}
async function productImages(id) {
 const client=requireSupabase(),r=await client.from('product_images').select('*').eq('product_id',id).order('sort_order');if(r.error)throw r.error;
 const html=await Promise.all((r.data||[]).map(async im=>{let url='';if(im.storage_bucket==='xukuru-public')url=client.storage.from(im.storage_bucket).getPublicUrl(im.storage_path).data.publicUrl;else{const s=await client.storage.from(im.storage_bucket).createSignedUrl(im.storage_path,1200);url=s.data?.signedUrl||'';}
 return '<article class="media-card">'+(url?'<img src="'+esc(url)+'" alt="'+esc(im.alt_text)+'">':'Prévia indisponível')+'<p>'+esc(im.alt_text)+' · '+titleCase(im.authorization_status)+'</p><button class="btn btn-quiet" data-action="cover" data-id="'+im.id+'" data-product="'+id+'">Definir capa</button> <button class="btn btn-danger" data-action="remove-image" data-id="'+im.id+'" data-product="'+id+'">Remover</button></article>'; }));
 $('#product-images').innerHTML=html.join('')||'<div class="empty-state">Nenhuma imagem.</div>';
}
async function setCover(imageId,productId) {
 const c=requireSupabase();let r=await c.from('product_images').update({is_cover:false}).eq('product_id',productId);if(r.error){toast(errorText(r.error));return;}
 r=await c.from('product_images').update({is_cover:true}).eq('id',imageId);if(r.error)toast(errorText(r.error));else{toast('Capa alterada.');await productImages(productId);}
}
async function removeImage(imageId,productId) {
 if(!confirm('Remover a imagem? O arquivo só será apagado quando não tiver outro vínculo.'))return;
 const c=requireSupabase(),r=await c.from('product_images').select('*').eq('id',imageId).single();if(r.error){toast(errorText(r.error));return;}
 const im=r.data,sections=await c.from('operator_page_sections').select('draft_content,published_content');if(sections.error){toast(errorText(sections.error));return;}if((sections.data||[]).some(s=>JSON.stringify([s.draft_content,s.published_content]).includes(im.storage_path))){toast('Esta imagem também está referenciada em conteúdo de página. Remova o vínculo antes.');return;}
 const refs=await c.from('product_images').select('id',{count:'exact',head:true}).eq('storage_bucket',im.storage_bucket).eq('storage_path',im.storage_path);
 if(refs.error){toast(errorText(refs.error));return;}
 const d=await c.from('product_images').delete().eq('id',imageId);if(d.error){toast(errorText(d.error));return;}
 if((refs.count||0)<=1){
  const asset=await c.from('media_assets').delete().eq('storage_bucket',im.storage_bucket).eq('storage_path',im.storage_path);if(asset.error){toast('Vínculo removido, mas o arquivo foi mantido na biblioteca. '+errorText(asset.error));await productImages(productId);return;}
  const file=await c.storage.from(im.storage_bucket).remove([im.storage_path]);if(file.error){toast('Vínculo removido; o arquivo permanece sem uso e pode ser removido pela biblioteca.');await productImages(productId);return;}
 }
 toast('Imagem removida.');await productImages(productId);
}
async function publishProduct(id) {
 if(!admin()){toast('Somente admin publica.');return;}
 const product=state.products.find(p=>p.id===id);if(!product)return;
 if(product.cultural_approval_status!=='approved'||!product.cultural_approved_by||!product.cultural_approved_at){toast('Registre a validação cultural real no formulário antes de publicar.');return;}
 if(!confirm('Publicar este item? Confirme autorização de texto/imagens, informações e preço indicativo.'))return;
 const client=requireSupabase(),list=await client.from('product_images').select('*').eq('product_id',id);if(list.error){toast(errorText(list.error));return;}
 const copied=[];
 try {
  for(const im of list.data||[]){if(im.storage_bucket==='xukuru-public'&&im.authorization_status==='approved')continue;if(im.authorization_status==='rejected')throw new Error('Há uma imagem rejeitada.');
   const download=await client.storage.from('xukuru-drafts').download(im.storage_path);if(download.error)throw download.error;
   const path=id+'/'+crypto.randomUUID()+'.'+im.storage_path.split('.').pop();
   const media=await client.from('media_assets').select('id').eq('storage_bucket','xukuru-drafts').eq('storage_path',im.storage_path).maybeSingle();
   if(media.error)throw media.error;
   if(media.data){const approve=await client.from('media_assets').update({storage_bucket:'xukuru-public',storage_path:path,authorization_status:'approved'}).eq('id',media.data.id);if(approve.error)throw approve.error;}
   else {const insert=await client.from('media_assets').insert({storage_bucket:'xukuru-public',storage_path:path,mime_type:download.data.type,size_bytes:download.data.size,alt_text:im.alt_text,authorization_status:'approved',created_by:state.operator.user.id});if(insert.error)throw insert.error;}
   const up=await client.storage.from('xukuru-public').upload(path,download.data,{contentType:download.data.type,upsert:false});if(up.error){if(media.data)await client.from('media_assets').update({storage_bucket:'xukuru-drafts',storage_path:im.storage_path,authorization_status:'pending'}).eq('id',media.data.id);else await client.from('media_assets').delete().eq('storage_bucket','xukuru-public').eq('storage_path',path);throw up.error;}
   const change=await client.from('product_images').update({storage_bucket:'xukuru-public',storage_path:path,authorization_status:'approved'}).eq('id',im.id);if(change.error){if(media.data)await client.from('media_assets').update({storage_bucket:'xukuru-drafts',storage_path:im.storage_path,authorization_status:'pending'}).eq('id',media.data.id);else await client.from('media_assets').delete().eq('storage_bucket','xukuru-public').eq('storage_path',path);await client.storage.from('xukuru-public').remove([path]);throw change.error;}copied.push({im,path,mediaId:media.data?.id});
  }
  const result=await client.from('products').update({status:'published'}).eq('id',id);if(result.error)throw result.error;
  for(const x of copied)await client.storage.from('xukuru-drafts').remove([x.im.storage_path]);
  toast('Produto publicado.');await products();
 } catch(err){for(const x of copied){await client.from('product_images').update({storage_bucket:'xukuru-drafts',storage_path:x.im.storage_path,authorization_status:'pending'}).eq('id',x.im.id);if(x.mediaId)await client.from('media_assets').update({storage_bucket:'xukuru-drafts',storage_path:x.im.storage_path,authorization_status:'pending'}).eq('id',x.mediaId);else await client.from('media_assets').delete().eq('storage_bucket','xukuru-public').eq('storage_path',x.path);await client.storage.from('xukuru-public').remove([x.path]);}toast(errorText(err));}
}
async function productStatus(id,status) {
 if(!admin())return;if(!confirm(status==='archived'?'Arquivar este produto?':'Retirar este produto da vitrine?'))return;
 const r=await requireSupabase().from('products').update({status}).eq('id',id);if(r.error)toast(errorText(r.error));else{toast('Status atualizado.');await products();}
}

async function categories() {
 state.categories=await rows('categories');
 $('#admin-content').innerHTML=heading('Categorias','Categorias ativas alimentam os filtros do catálogo. Não é possível remover categorias vinculadas.',admin()?'<button class="btn btn-primary" data-action="new-category">＋ Nova categoria</button>':'')+'<div id="category-form-host"></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Nome</th><th>Slug</th><th>Ordem</th><th>Ativa</th><th></th></tr></thead><tbody>'+state.categories.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.slug)+'</td><td>'+c.sort_order+'</td><td>'+(c.is_active?'Sim':'Não')+'</td><td>'+(admin()?'<button class="btn btn-quiet" data-action="edit-category" data-id="'+c.id+'">Editar</button> <button class="btn btn-danger" data-action="delete-category" data-value="'+esc(c.slug)+'">Remover</button>':'Somente leitura')+'</td></tr>').join('')+'</tbody></table></div>';
}
function categoryForm(c=null) {
 $('#category-form-host').innerHTML='<section class="panel"><h3>'+(c?'Editar':'Nova')+' categoria</h3><form id="category-form" class="fields-grid"><div class="field"><label>Nome<input name="name" value="'+esc(c?.name||'')+'" required></label></div><div class="field full"><label>Descrição<textarea name="description">'+esc(c?.description||'')+'</textarea></label></div><div class="field"><label>Ordem<input name="sort_order" type="number" value="'+esc(c?.sort_order||0)+'"></label></div><label class="checkbox-field"><input name="is_active" type="checkbox" '+(c?.is_active===false?'':'checked')+'> Ativa</label><div class="button-row field full"><button class="btn btn-primary">Salvar</button><button type="button" class="btn btn-quiet" data-action="cancel-category">Cancelar</button></div></form></section>';
 $('#category-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),name=String(fd.get('name')||'').trim();if(!name){toast('Informe um nome.');return;}const row={name,slug:slugify(name),description:fd.get('description')||'',sort_order:Number(fd.get('sort_order')||0),is_active:fd.has('is_active')};const r=c?await requireSupabase().from('categories').update(row).eq('id',c.id):await requireSupabase().from('categories').insert(row);if(r.error)toast(errorText(r.error));else{toast('Categoria salva.');await categories();}};
}
async function deleteCategory(slug) {
 const c=requireSupabase(),r=await c.from('products').select('id',{count:'exact',head:true}).eq('category_slug',slug);if(r.error){toast(errorText(r.error));return;}if(r.count){toast('Reclassifique os produtos vinculados antes de remover.');return;}
 if(!confirm('Remover esta categoria?'))return;const d=await c.from('categories').delete().eq('slug',slug);if(d.error)toast(errorText(d.error));else{toast('Categoria removida.');await categories();}
}

async function content() {
 const client=requireSupabase(),page=await client.from('site_pages').select('*').eq('slug',state.pageSlug).single();if(page.error)throw page.error;
 state.page=page.data;state.pages=await rows('site_pages','id,slug,title');const sec=await client.from('operator_page_sections').select('*').eq('page_id',state.page.id).order('draft_sort_order');if(sec.error)throw sec.error;
 state.sections=sec.data||[];if(!state.sections.some(s=>s.id===state.sectionId))state.sectionId=state.sections[0]?.id||null;
 const selected=state.sections.find(s=>s.id===state.sectionId),fields=selected?.draft_content?.fields||{};
 $('#admin-content').innerHTML=heading('Editor de páginas','Edite texto seguro, ordem e visibilidade. Rascunhos não aparecem ao visitante.')+'<div class="toolbar"><label for="cms-page">Página</label><select id="cms-page">'+state.pages.map(p=>'<option value="'+p.slug+'" '+(p.slug===state.pageSlug?'selected':'')+'>'+esc(p.title)+'</option>').join('')+'</select></div><div class="editor-grid"><aside class="section-list">'+state.sections.map(s=>'<button class="section-pick '+(s.id===state.sectionId?'active':'')+'" data-action="select-section" data-id="'+s.id+'"><strong>'+esc(s.section_key)+'</strong><br><small>'+esc(s.section_type)+' · '+(s.draft_is_visible?'visível':'oculta')+'</small></button>').join('')+'</aside><div class="section-card">'+(selected?'<h3>'+esc(selected.section_key)+'</h3><p>O conteúdo é inserido como texto; HTML e JavaScript arbitrários não são executados.</p><div class="fields-grid">'+Object.entries(fields).map(([k,v])=>'<div class="field '+(String(v).length>120?'full':'')+'"><label for="cms-'+esc(k)+'">'+esc(k)+' <small>'+String(v||'').length+' caracteres</small></label>'+(String(v||'').length>120?'<textarea maxlength="5000" data-cms-field="'+esc(k)+'">'+esc(v)+'</textarea>':'<input maxlength="500" id="cms-'+esc(k)+'" data-cms-field="'+esc(k)+'" value="'+esc(v)+'">')+'</div>').join('')+'</div><div class="toolbar"><label for="section-layout">Layout</label><select id="section-layout">'+SAFE_LAYOUTS.map(x=>'<option value="'+x+'" '+(selected.draft_style?.layout===x?'selected':'')+'>'+x+'</option>').join('')+'</select><label class="checkbox-field"><input type="checkbox" id="section-visible" '+(selected.draft_is_visible?'checked':'')+'> Visível</label></div><div class="button-row"><button class="btn btn-primary" data-action="save-section">Salvar rascunho</button><button class="btn btn-quiet" data-action="preview-section">Pré-visualizar</button><button class="btn btn-quiet" data-action="restore-section">Restaurar versão</button><button class="btn btn-quiet" data-action="move-section" data-value="-1">↑</button><button class="btn btn-quiet" data-action="move-section" data-value="1">↓</button>'+(admin()?'<button class="btn btn-secondary" data-action="publish-section">Publicar alterações</button>':'')+'</div><div id="cms-preview" class="preview-frame" hidden></div>':'<div class="empty-state">Sem seções. Execute o seed do CMS.</div>')+'</div></div>';
 if(selected && admin()) {
  const approval=document.createElement('div');approval.className='field full';
  approval.innerHTML='<label for="section-approval-reference">Referência da validação/autorização <small>Registre uma referência mínima, sem dados pessoais sensíveis.</small></label><input id="section-approval-reference" maxlength="300" value="'+esc(selected.content_approval_reference||'')+'">';
  $('#admin-content .button-row')?.before(approval);
  const status=document.createElement('p');status.className='notice';status.textContent='Validação registrada: '+titleCase(selected.content_approval_status||'pending')+'. Alterar o rascunho exige nova validação antes de publicar.';
  approval.after(status);
 }
 installSectionImageUploads();
 $('#cms-page').onchange=e=>{if(state.sectionDirty&&!confirm('Descartar as alterações não salvas desta seção?')){e.target.value=state.pageSlug;return;}state.sectionDirty=false;state.pageSlug=e.target.value;state.sectionId=null;content().catch(showError);};
}
function installSectionImageUploads() {
 document.querySelectorAll('[data-cms-field]').forEach(field=>{
  const key=field.dataset.cmsField;
  if(!/\.(image|image_url)$/.test(key))return;
  const wrap=document.createElement('div');wrap.className='field full section-image-upload';
  const label=document.createElement('label');label.textContent='Trocar foto pelo computador';
  const altLabel=document.createElement('label');altLabel.textContent='Texto alternativo da foto';
  const altInput=document.createElement('input');altInput.type='text';altInput.maxLength=300;altInput.dataset.cmsImageAlt=key;
  const selected=state.sections.find(s=>s.id===state.sectionId),savedAlt=selected?.draft_content?.image_alt?.[key];altInput.value=typeof savedAlt==='string'?savedAlt:key.replace(/\./g,' ');
  const picker=document.createElement('input');picker.type='file';picker.accept='image/jpeg,image/png,image/webp';picker.disabled=!admin();
  const note=document.createElement('small');note.textContent=admin()?'JPEG, PNG ou WebP até 5 MB. A imagem ficará acessível publicamente após a confirmação; a seção só muda no site quando você a publicar.':'Somente um administrador pode enviar imagens.';
  wrap.append(label,altLabel,altInput,picker,note);field.closest('.field')?.append(wrap);
  picker.addEventListener('change',async()=>{
   const file=picker.files?.[0];if(!file)return;
   const valid=validateImage(file);if(!valid.valid){toast(valid.error);picker.value='';return;}
   picker.disabled=true;note.textContent='Enviando imagem…';
   try{
    if(!altInput.value.trim()){toast('Informe o texto alternativo da foto.');return;}
    const url=await uploadSectionImage(file,key,altInput.value.trim());
    if(url){field.value=url;field.dispatchEvent(new Event('input',{bubbles:true}));note.textContent='Imagem vinculada ao rascunho. Salve e publique a seção para mostrá-la no site.';}
    else note.textContent='Envio cancelado.';
   }catch(err){note.textContent='Não foi possível enviar a imagem.';toast(errorText(err));}
   finally{picker.value='';picker.disabled=!admin();}
  });
 });
}
async function uploadSectionImage(file,key,alt) {
 if(!admin())throw new Error('Somente admin pode enviar imagens para páginas.');
 const reference=prompt('Referência interna da autorização da imagem:');
 if(!reference?.trim()){toast('O envio exige uma referência de autorização.');return '';}
 if(!confirm('Confirma que esta foto pode ser publicada? O arquivo ficará acessível publicamente assim que o envio terminar. A seção só será atualizada no site quando você publicar as alterações.'))return '';
 const client=requireSupabase(),ext=file.type==='image/jpeg'?'jpg':file.type.split('/')[1];
 const draftPath='pages/'+state.page.slug+'/'+crypto.randomUUID()+'.'+ext;
 const privateUpload=await client.storage.from('xukuru-drafts').upload(draftPath,file,{contentType:file.type,upsert:false});
 if(privateUpload.error)throw privateUpload.error;
 const inserted=await client.from('media_assets').insert({storage_bucket:'xukuru-drafts',storage_path:draftPath,mime_type:file.type,size_bytes:file.size,alt_text:alt.trim().slice(0,300),source_note:reference.trim().slice(0,300),authorization_status:'pending',created_by:state.operator.user.id}).select('id').single();
 if(inserted.error){await client.storage.from('xukuru-drafts').remove([draftPath]);throw inserted.error;}
 const publicPath='pages/'+state.page.slug+'/'+crypto.randomUUID()+'.'+ext;
 const approved=await client.from('media_assets').update({storage_bucket:'xukuru-public',storage_path:publicPath,authorization_status:'approved'}).eq('id',inserted.data.id);
 if(approved.error){await client.from('media_assets').delete().eq('id',inserted.data.id);await client.storage.from('xukuru-drafts').remove([draftPath]);throw approved.error;}
 const publicUpload=await client.storage.from('xukuru-public').upload(publicPath,file,{contentType:file.type,upsert:false});
 if(publicUpload.error){await client.from('media_assets').update({storage_bucket:'xukuru-drafts',storage_path:draftPath,authorization_status:'pending'}).eq('id',inserted.data.id);await client.storage.from('xukuru-drafts').remove([draftPath]);throw publicUpload.error;}
 await client.storage.from('xukuru-drafts').remove([draftPath]);
 return client.storage.from('xukuru-public').getPublicUrl(publicPath).data.publicUrl;
}
function sectionData(section) {
 const fields=Object.assign({},section.draft_content?.fields||{}),imageAlt=Object.assign({},section.draft_content?.image_alt||{});document.querySelectorAll('[data-cms-field]').forEach(el=>fields[el.dataset.cmsField]=el.value);document.querySelectorAll('[data-cms-image-alt]').forEach(el=>imageAlt[el.dataset.cmsImageAlt]=el.value.trim());
 return {draft_content:Object.assign({},section.draft_content,{fields,image_alt:imageAlt}),draft_style:Object.assign({},section.draft_style,{layout:$('#section-layout').value}),draft_is_visible:$('#section-visible').checked};
}
async function saveSection(publish=false) {
 const s=state.sections.find(x=>x.id===state.sectionId);if(!s)return;
 const d=sectionData(s),patch=Object.assign({},d);
 const client=requireSupabase();
 if(publish){
  if(!admin()){toast('Somente admin publica.');return;}
  const reference=$('#section-approval-reference')?.value.trim();
  if(!reference||!confirm('Confirme que texto, imagem, autorização cultural e alegações desta seção foram verificadas por uma pessoa responsável.')){toast('Registre a referência e confirme a validação antes de publicar.');return;}
  const save=await client.from('page_sections').update(d).eq('id',s.id);if(save.error){toast(errorText(save.error));return;}
  const reset=await client.from('page_sections').update({content_approval_status:'pending',content_approval_reference:reference,content_approved_by:null,content_approved_at:null}).eq('id',s.id);if(reset.error){toast(errorText(reset.error));return;}
  Object.assign(patch,{content_approval_status:'approved',content_approval_reference:reference,published_content:d.draft_content,published_style:d.draft_style,published_is_visible:d.draft_is_visible,published_sort_order:s.draft_sort_order,published_at:new Date().toISOString()});
 }
 const r=await client.from('page_sections').update(patch).eq('id',s.id);if(r.error)toast(errorText(r.error));else{state.sectionDirty=false;toast(publish?'Publicado.':'Rascunho salvo.');await content();}
}
async function restoreSection() {
 const s=state.sections.find(x=>x.id===state.sectionId);if(!s)return;
 const r=await requireSupabase().from('content_revisions').select('old_snapshot').eq('entity_type','page_section').eq('entity_id',s.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(r.error||!r.data?.old_snapshot){toast('Não há versão anterior.');return;}if(!confirm('Restaurar a última versão anterior como rascunho?'))return;
 const old=r.data.old_snapshot,d=await requireSupabase().from('page_sections').update({draft_content:old.draft_content||old.published_content,draft_style:old.draft_style||old.published_style,draft_is_visible:old.draft_is_visible??true,draft_sort_order:old.draft_sort_order??s.draft_sort_order}).eq('id',s.id);
 if(d.error)toast(errorText(d.error));else{state.sectionDirty=false;toast('Versão restaurada como rascunho.');await content();}
}
function previewSection() {
 const s=state.sections.find(x=>x.id===state.sectionId),d=sectionData(s),box=$('#cms-preview');box.hidden=false;
 const fields=Object.entries(d.draft_content.fields||{}).filter(([,v])=>typeof v==='string'&&v.trim());
 const cards=fields.map(([k,v])=>'<article><small>'+esc(k)+'</small><p>'+esc(v)+'</p></article>').join('');
 box.innerHTML='<div class="preview-toolbar"><strong>Prévia protegida · '+esc(state.page.title)+'</strong><div class="button-row"><button class="btn btn-quiet" data-action="preview-width" data-value="desktop">Desktop</button><button class="btn btn-quiet" data-action="preview-width" data-value="mobile">Celular</button></div></div><div class="cms-preview-viewport"><iframe title="Prévia do rascunho" sandbox=""></iframe></div><small>Esta prévia aparece somente dentro do painel autenticado.</small>';
 const frame=$('iframe',box),layout=SAFE_LAYOUTS.includes(d.draft_style?.layout)?d.draft_style.layout:'standard';
 frame.srcdoc='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:22px;background:#f9f6f0;color:#2b231f;font:16px Outfit,Arial,sans-serif}.preview{max-width:900px;margin:auto;background:#fff;border-radius:12px;padding:24px;border-top:5px solid #1f3e2b}.eyebrow{color:#c45a35;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.grid article{background:#f9f6f0;border-radius:8px;padding:14px}.grid small{color:#58715f}.grid p{white-space:pre-wrap;line-height:1.6;margin:.5rem 0 0}.layout-text-left .grid,.layout-text-right .grid,.layout-image-text .grid{grid-template-columns:1fr}.layout-cards-3 .grid{grid-template-columns:repeat(3,minmax(0,1fr))}.layout-cards-4 .grid{grid-template-columns:repeat(4,minmax(0,1fr))}@media(max-width:600px){.grid,.layout-cards-3 .grid,.layout-cards-4 .grid{grid-template-columns:1fr}body{padding:10px}}</style><main class="preview layout-'+layout+'"><span class="eyebrow">'+esc(s.section_key)+'</span><h1>'+esc(state.page.title)+'</h1><div class="grid">'+(cards||'<p>Esta seção ainda não tem textos.</p>')+'</div></main></html>';
}
async function moveSection(delta) {
 const idx=state.sections.findIndex(s=>s.id===state.sectionId),other=state.sections[idx+delta];if(!other)return;const s=state.sections[idx],c=requireSupabase();
 const a=await c.from('page_sections').update({draft_sort_order:other.draft_sort_order}).eq('id',s.id);const b=await c.from('page_sections').update({draft_sort_order:s.draft_sort_order}).eq('id',other.id);
 if(a.error||b.error)toast(errorText(a.error||b.error));else{toast('Ordem atualizada.');await content();}
}

async function appearance() {
 const r=await requireSupabase().from('operator_site_settings').select('*').eq('key','theme').maybeSingle();if(r.error)throw r.error;
 state.themeSettings=r.data;
 state.theme=r.data?.draft_value||{primary:'#1F3E2B',secondary:'#C45A35',accent:'#D99B26',background:'#F9F6F0',font:'Outfit',layout:'standard'};
 const t=state.theme,disabled=admin()?'':'disabled';
 $('#admin-content').innerHTML=heading('Aparência','Cores hexadecimais e presets permitidos. Editor CSS livre não é aceito.')+(!admin()?'<div class="notice">Somente admin pode salvar e publicar aparência.</div>':'')+'<section class="panel"><div class="fields-grid">'+[['primary','Verde principal'],['secondary','Terracota'],['accent','Ocre'],['background','Fundo']].map(x=>'<div class="field"><label for="theme-'+x[0]+'">'+x[1]+'</label><input type="color" id="theme-'+x[0]+'" value="'+esc(/^#[0-9a-f]{6}$/i.test(t[x[0]]||'')?t[x[0]]:'#1F3E2B')+'" '+disabled+'></div>').join('')+'<div class="field"><label for="theme-font">Fonte</label><select id="theme-font" '+disabled+'>'+SAFE_FONTS.map(x=>'<option '+(t.font===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div class="field"><label for="theme-layout">Preset</label><select id="theme-layout" '+disabled+'>'+SAFE_LAYOUTS.map(x=>'<option '+(t.layout===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div></div><div id="theme-preview" class="preview-frame"><h4>Prévia da identidade visual</h4><p>Arte Xukuru do Ororubá</p></div><div class="button-row"><button class="btn btn-primary" data-action="save-theme" '+disabled+'>Salvar rascunho</button><button class="btn btn-secondary" data-action="publish-theme" '+disabled+'>Publicar tema</button><button class="btn btn-quiet" data-action="reset-theme" '+disabled+'>Restaurar padrão</button></div></section>';
 const preview=()=>{const x=readTheme(),box=$('#theme-preview');box.style.background=x.background;box.style.color=x.primary;box.style.borderColor=x.accent;box.querySelector('h4').style.color=x.primary;};
 document.querySelectorAll('[id^="theme-"]').forEach(el=>el.addEventListener('input',preview));preview();
}
function readTheme(){return{primary:$('#theme-primary').value,secondary:$('#theme-secondary').value,accent:$('#theme-accent').value,background:$('#theme-background').value,font:$('#theme-font').value,layout:$('#theme-layout').value};}
async function saveTheme(publish=false) {
 const theme=readTheme();if(!validateTheme(theme)){toast('Tema inválido ou com contraste de texto insuficiente.');return;}
 if(publish&&!confirm('Publicar a nova aparência do site?'))return;
 const patch={key:'theme',draft_value:theme,published_value:publish?theme:(state.themeSettings?.published_value||{}),published_at:publish?new Date().toISOString():(state.themeSettings?.published_at||null)};
 const r=await requireSupabase().from('site_settings').upsert(patch,{onConflict:'key'});if(r.error)toast(errorText(r.error));else{state.themeSettings=patch;toast(publish?'Tema publicado.':'Rascunho de tema salvo.');}
}
async function resetTheme() {
 const d={primary:'#1F3E2B',secondary:'#C45A35',accent:'#D99B26',background:'#F9F6F0',font:'Outfit',layout:'standard'};
 for(const k in d){const el=$('#theme-'+k);if(el)el.value=d[k];}toast('Padrão restaurado na prévia. Salve para aplicar.');
}

async function media() {
 state.media=await rows('media_assets');
 $('#admin-content').innerHTML=heading('Biblioteca de mídia','JPEG, PNG ou WebP até 5 MB. Novos arquivos ficam privados.')+'<section class="panel"><form id="media-form" class="fields-grid"><div class="field"><label for="media-file">Arquivo</label><input id="media-file" type="file" accept="image/jpeg,image/png,image/webp" required></div><div class="field"><label for="media-alt">Texto alternativo</label><input id="media-alt" maxlength="300" required></div><div class="field full"><label for="media-source">Origem e autorização (nota interna)</label><input id="media-source" maxlength="300"></div><div class="button-row field full"><button class="btn btn-primary">Enviar para bucket privado</button><span id="upload-status" aria-live="polite"></span></div></form></section><div class="media-grid">'+state.media.map(m=>'<article class="media-card" data-media-card="'+m.id+'"><div class="media-slot">Carregando…</div><strong>'+esc(m.alt_text||'Sem ALT')+'</strong><p>'+esc(m.mime_type)+' · '+Math.ceil(m.size_bytes/1024)+' KB · '+titleCase(m.authorization_status)+'</p><button class="btn btn-danger" data-action="delete-media" data-id="'+m.id+'">Remover sem vínculos</button></article>').join('')+'</div>';
 await Promise.all(state.media.map(async m=>{let url='';if(m.storage_bucket==='xukuru-public')url=requireSupabase().storage.from(m.storage_bucket).getPublicUrl(m.storage_path).data.publicUrl;else{const r=await requireSupabase().storage.from(m.storage_bucket).createSignedUrl(m.storage_path,900);url=r.data?.signedUrl||'';}const card=$('[data-media-card="'+CSS.escape(m.id)+'"]'),slot=$('.media-slot',card);if(url)slot.innerHTML='<img src="'+esc(url)+'" alt="'+esc(m.alt_text)+'">';else slot.textContent='Prévia indisponível';if(admin()||(m.storage_bucket==='xukuru-drafts'&&m.authorization_status==='pending')){const edit=document.createElement('button');edit.className='btn btn-quiet';edit.textContent='Editar ALT';edit.onclick=()=>editMediaAlt(m);slot.parentElement.append(edit);}if(m.storage_bucket==='xukuru-public'){const copy=document.createElement('button');copy.className='btn btn-quiet';copy.textContent='Copiar URL publicada';copy.onclick=()=>navigator.clipboard?.writeText(url).then(()=>toast('URL copiada.')).catch(()=>toast('Não foi possível copiar a URL.'));slot.parentElement.append(copy);}if(admin()&&m.authorization_status!=='approved'){const b=document.createElement('button');b.className='btn btn-quiet';b.textContent='Registrar autorização e publicar';b.onclick=()=>approveMedia(m);slot.parentElement.append(b);}}));
 $('#media-form').onsubmit=uploadMedia;
}
async function uploadMedia(e) {
 e.preventDefault();const file=$('#media-file').files[0],valid=validateImage(file);if(!valid.valid){toast(valid.error);return;}
 $('#upload-status').textContent='Enviando imagem…';const ext=file.type==='image/jpeg'?'jpg':file.type.split('/')[1],path='library/'+crypto.randomUUID()+'.'+ext,c=requireSupabase();
 const up=await c.storage.from('xukuru-drafts').upload(path,file,{contentType:file.type,upsert:false});if(up.error){toast(errorText(up.error));return;}
 const row=await c.from('media_assets').insert({storage_bucket:'xukuru-drafts',storage_path:path,mime_type:file.type,size_bytes:file.size,alt_text:$('#media-alt').value,source_note:$('#media-source').value,authorization_status:'pending',created_by:state.operator.user.id});
 if(row.error){await c.storage.from('xukuru-drafts').remove([path]);toast(errorText(row.error));return;}toast('Upload privado concluído.');await media();
}
async function editMediaAlt(m) {
 const next=prompt('Texto alternativo da imagem:',m.alt_text||'');if(next===null)return;
 const value=next.trim().slice(0,300);if(!value){toast('Informe um texto alternativo.');return;}
 const client=requireSupabase(),result=await client.from('media_assets').update({alt_text:value}).eq('id',m.id);
 if(result.error){toast(errorText(result.error));return;}
 const images=await client.from('product_images').update({alt_text:value}).eq('storage_bucket',m.storage_bucket).eq('storage_path',m.storage_path);
 if(images.error){toast('ALT da biblioteca atualizado, mas não foi possível sincronizar os vínculos com produtos.');return;}
 toast('Texto alternativo atualizado.');await media();
}
async function approveMedia(m) {
 if(!admin()||!confirm('Você confirmou a autorização da imagem? O upload não constitui autorização.'))return;
 const reference=prompt('Registre uma referência interna da autorização. Não insira documentos ou dados pessoais sensíveis:');if(!reference?.trim()){toast('A publicação da mídia exige uma referência de autorização.');return;}
 const c=requireSupabase(),refs=await c.from('product_images').select('id',{count:'exact',head:true}).eq('storage_bucket','xukuru-drafts').eq('storage_path',m.storage_path);if(refs.error){toast(errorText(refs.error));return;}if(refs.count){toast('Esta imagem pertence a um produto. Aprove e publique o produto na seção Produtos.');return;}
 const d=await c.storage.from('xukuru-drafts').download(m.storage_path);if(d.error){toast(errorText(d.error));return;}
 const path='library/'+crypto.randomUUID()+'.'+m.storage_path.split('.').pop(),change=await c.from('media_assets').update({storage_bucket:'xukuru-public',storage_path:path,authorization_status:'approved',source_note:reference.trim().slice(0,300)}).eq('id',m.id);if(change.error){toast(errorText(change.error));return;}
 const up=await c.storage.from('xukuru-public').upload(path,d.data,{contentType:m.mime_type,upsert:false});if(up.error){await c.from('media_assets').update({storage_bucket:'xukuru-drafts',storage_path:m.storage_path,authorization_status:'pending'}).eq('id',m.id);toast(errorText(up.error));return;}
 await c.storage.from('xukuru-drafts').remove([m.storage_path]);toast('Imagem aprovada e publicada.');await media();
}
async function deleteMedia(id) {
 const m=state.media.find(x=>x.id===id);if(!m)return;const c=requireSupabase(),refs=await c.from('product_images').select('id',{count:'exact',head:true}).eq('storage_bucket',m.storage_bucket).eq('storage_path',m.storage_path);
 if(refs.error){toast(errorText(refs.error));return;}if(refs.count){toast('Esta imagem está vinculada a produto. Remova o vínculo antes.');return;}
 const sections=await c.from('operator_page_sections').select('draft_content,published_content');if(sections.error){toast(errorText(sections.error));return;}if((sections.data||[]).some(s=>JSON.stringify([s.draft_content,s.published_content]).includes(m.storage_path))){toast('Esta imagem está referenciada em conteúdo de página. Remova o vínculo antes.');return;}
 if(!confirm('Excluir esta mídia?'))return;const d=await c.from('media_assets').delete().eq('id',id);if(d.error){toast(errorText(d.error));return;}const file=await c.storage.from(m.storage_bucket).remove([m.storage_path]);if(file.error){toast('Registro removido, mas o arquivo ficou no bucket sem vínculo. Confira a política Storage.');await media();return;}toast('Mídia removida.');await media();
}
const settingsSchema={
 identity:{title:'Identidade',fields:[['name','Nome da vitrine','text',120],['description','Descrição institucional','textarea',300],['logo_url','Logo no cabeçalho (URL pública da biblioteca)','url',500],['favicon_url','Favicon PNG (URL pública da biblioteca)','url',500]]},
 contacts:{title:'Contato confirmado',fields:[['email','E-mail','email',160],['whatsapp','WhatsApp (somente dígitos, com país e DDD)','text',15]]},
 seo:{title:'SEO básico',fields:[['title','Título do site','text',160],['description','Descrição para buscadores','textarea',500]]},
 notices:{title:'Avisos públicos',fields:[['checkout','Aviso de checkout','textarea',1000],['claims','Aviso sobre alegações pendentes','textarea',1000]]}
};
const settingsDefaults={identity:{name:'Arte Xukuru',description:'do Ororubá',logo_url:'',favicon_url:''},contacts:{email:'',whatsapp:''},seo:{title:'Arte Xukuru do Ororubá',description:'Vitrine demonstrativa em implantação.'},notices:{checkout:'Demonstração: nenhum pagamento ou pedido é processado.',claims:'Alegações comerciais, culturais, médicas e de certificação pendentes de validação.'}};
async function settings() {
 state.settings=await rows('operator_site_settings');const disabled=admin()?'':'disabled';
 $('#admin-content').innerHTML=heading('Configurações','Edite rascunhos públicos de identidade, contato, SEO e avisos. Publicar exige perfil administrador.')+(!admin()?'<div class="notice">Somente admin salva ou publica configurações.</div>':'')+Object.entries(settingsSchema).map(([key,group])=>{const row=state.settings.find(x=>x.key===key),value=row?.draft_value||settingsDefaults[key];return '<section class="panel settings-card"><h3>'+esc(group.title)+'</h3><div class="fields-grid">'+group.fields.map(([name,label,type,max])=>'<div class="field '+(type==='textarea'?'full':'')+'"><label for="setting-'+key+'-'+name+'">'+esc(label)+'</label>'+(type==='textarea'?'<textarea id="setting-'+key+'-'+name+'" data-setting-key="'+key+'" data-setting-field="'+name+'" maxlength="'+max+'" '+disabled+'>'+esc(value[name]||'')+'</textarea>':'<input id="setting-'+key+'-'+name+'" data-setting-key="'+key+'" data-setting-field="'+name+'" type="'+type+'" maxlength="'+max+'" value="'+esc(value[name]||'')+'" '+disabled+'>')+'</div>').join('')+'</div><div class="button-row">'+(admin()?'<button class="btn btn-quiet" data-action="save-setting" data-value="'+key+'">Salvar rascunho</button><button class="btn btn-secondary" data-action="publish-setting" data-value="'+key+'">Publicar</button>':'')+'<span class="status-pill">'+(row?.published_at?'Publicado em '+esc(new Date(row.published_at).toLocaleDateString('pt-BR')):'Ainda não publicado')+'</span></div></section>';}).join('');
}
async function saveSetting(key,publish=false) {
 if(!admin()||!settingsSchema[key]){toast('Somente admin pode alterar configurações.');return;}
 const value={};document.querySelectorAll('[data-setting-key="'+key+'"]').forEach(el=>value[el.dataset.settingField]=el.value.trim());
 if(key==='identity'&&['logo_url','favicon_url'].some(field=>value[field]&&!isApprovedMediaUrl(value[field]))){toast('Logo e favicon devem usar URLs aprovadas do bucket público do Supabase.');return;}
 if(key==='contacts'&&value.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)){toast('Confira o e-mail.');return;}
 if(key==='contacts'&&value.whatsapp&&!/^\d{8,15}$/.test(value.whatsapp)){toast('WhatsApp deve conter de 8 a 15 dígitos, incluindo país e DDD.');return;}
 if(publish&&!confirm('Publicar estas configurações no site? Verifique os dados antes de confirmar.'))return;
 const current=state.settings.find(x=>x.key===key),row={key,draft_value:value,published_value:publish?value:(current?.published_value||{}),published_at:publish?new Date().toISOString():(current?.published_at||null)};
 const {error}=await requireSupabase().from('site_settings').upsert(row,{onConflict:'key'});if(error){toast(errorText(error));return;}toast(publish?'Configurações publicadas.':'Rascunho de configurações salvo.');await settings();
}
async function historyPage() {
 if(!admin()){state.module='dashboard';return shell();}
 const [logs,revs]=await Promise.all([rows('audit_logs'),rows('content_revisions')]);logs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));revs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 $('#admin-content').innerHTML=heading('Histórico e auditoria','Registros gerados no banco. Acesso restrito a administradores.')+'<section class="panel"><h3>Atividade recente</h3>'+(logs.length?'<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Quando</th><th>Ação</th><th>Tipo</th><th>Resumo</th></tr></thead><tbody>'+logs.slice(0,100).map(x=>'<tr><td>'+esc(new Date(x.created_at).toLocaleString('pt-BR'))+'</td><td>'+titleCase(x.action)+'</td><td>'+esc(x.entity_type)+'</td><td>'+esc(x.summary)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty-state">Nenhum registro.</div>')+'</section><section class="panel"><h3>Versões anteriores</h3><p>'+revs.length+' snapshots preservados para restauração no editor.</p></section>';
}
async function logout(){try{await signOut();}catch(e){toast(errorText(e));}state.operator=null;renderLogin();}
async function boot() {
 if(!supabaseConfig.configured){renderLogin();return;}
 if(new URLSearchParams(location.search).get('reset')==='1'){renderLogin('',true);return;}
 try{state.operator=await getOperator();if(state.operator?.unauthorized)renderLogin('Acesso não autorizado. Peça ao administrador para liberar sua conta.');else if(state.operator)shell();else renderLogin();}catch(e){renderLogin(errorText(e));}
 supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){state.operator=null;renderLogin();}if(event==='TOKEN_REFRESHED'&&state.operator)setTimeout(async()=>{const op=await getOperator();if(!op||op.unauthorized){state.operator=null;renderLogin('Acesso não autorizado.');}},0);});
}
window.addEventListener('beforeunload',e=>{if(state.sectionDirty||state.productDirty){e.preventDefault();e.returnValue='';}});
root.addEventListener('input',e=>{if(e.target.closest('.section-card'))state.sectionDirty=true;});
root.addEventListener('change',e=>{if(e.target.closest('.section-card'))state.sectionDirty=true;});
root.addEventListener('submit',async e=>{
 if(e.target.id==='login-form'){e.preventDefault();const fd=new FormData(e.target),button=$('button[type="submit"]',e.target);button.disabled=true;
  try{if(new URLSearchParams(location.search).get('reset')==='1'){const r=await requireSupabase().auth.updateUser({password:fd.get('password')});if(r.error)throw new Error('Não foi possível trocar a senha. Abra novamente o link.');history.replaceState({},'',location.pathname);renderLogin();toast('Senha atualizada.');}
   else{state.operator=await signIn(fd.get('email'),fd.get('password'));state.module='dashboard';shell();}}
  catch(err){renderLogin(errorText(err),new URLSearchParams(location.search).get('reset')==='1');}finally{if(button.isConnected)button.disabled=false;}
 }
 if(e.target.id==='category-form')return;
});
root.addEventListener('click',async e=>{
 const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,id=b.dataset.id,value=b.dataset.value;
 try{
  if(action==='reset'){const email=$('input[name="email"]')?.value.trim();if(!email){renderLogin('Digite seu e-mail antes de pedir a recuperação.');return;}await requestPasswordReset(email,location.origin+location.pathname+'?reset=1');toast('Se a conta existir, o Supabase enviará um link.');}
  if(action==='logout'){if((state.sectionDirty||state.productDirty)&&!confirm('Descartar alterações não salvas e sair?'))return;state.sectionDirty=false;state.productDirty=false;await logout();}
  if(action==='module'){if((state.sectionDirty||state.productDirty)&&!confirm('Descartar alterações não salvas?'))return;state.sectionDirty=false;state.productDirty=false;state.module=value;shell();}
  if(action==='toggle-nav')$('#admin-sidebar').classList.toggle('open');
  if(action==='retry')loadModule().catch(showError);
  if(action==='import-local-photos')$('#local-photo-folder')?.click();
  if(action==='new-product'){if(!state.categories.length)state.categories=await rows('categories');await productForm();}
  if(action==='edit-product')await productForm(state.products.find(p=>p.id===id));
  if(action==='product-page'){state.productPage=Math.max(0,state.productPage+Number(value));drawProductTable();}
  if(action==='close-form'){if(state.productDirty&&!confirm('Descartar as alterações não salvas do produto?'))return;state.productDirty=false;$('#product-form-host').replaceChildren();}
  if(action==='request-review'){$('#p-status').value='pending_review';$('#product-form').requestSubmit();}
  if(action==='preview-product')previewProductModal();
  if(action==='close-product-preview')b.closest('dialog')?.close();
  if(action==='publish-product')await publishProduct(id);
  if(action==='unpublish-product')await productStatus(id,'draft');
  if(action==='archive-product')await productStatus(id,'archived');
  if(action==='new-category')categoryForm();
  if(action==='edit-category')categoryForm(state.categories.find(c=>c.id===id));
  if(action==='cancel-category')$('#category-form-host').replaceChildren();
  if(action==='delete-category')await deleteCategory(value);
  if(action==='home-editor'){if(state.sectionDirty&&!confirm('Descartar as alterações não salvas desta seção?'))return;state.sectionDirty=false;state.pageSlug='home';state.module='content';shell();}
  if(action==='select-section'){if(state.sectionDirty&&!confirm('Descartar as alterações não salvas desta seção?'))return;state.sectionDirty=false;state.sectionId=id;await content();}
  if(action==='save-section')await saveSection(false);
  if(action==='publish-section')await saveSection(true);
  if(action==='preview-section')previewSection();
  if(action==='preview-width')$('.cms-preview-viewport')?.classList.toggle('mobile',value==='mobile');
  if(action==='restore-section')await restoreSection();
  if(action==='move-section'){if(state.sectionDirty&&!confirm('Descartar as alterações de texto não salvas antes de mover a seção?'))return;state.sectionDirty=false;await moveSection(Number(value));}
  if(action==='save-theme')await saveTheme(false);
  if(action==='publish-theme')await saveTheme(true);
  if(action==='save-setting')await saveSetting(value,false);
  if(action==='publish-setting')await saveSetting(value,true);
  if(action==='reset-theme')await resetTheme();
  if(action==='cover')await setCover(id,b.dataset.product);
  if(action==='remove-image')await removeImage(id,b.dataset.product);
  if(action==='delete-media')await deleteMedia(id);
 }catch(err){toast(errorText(err));}
});
boot();

